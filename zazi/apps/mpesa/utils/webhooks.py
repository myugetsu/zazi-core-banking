import dateutil.parser
import datetime
import logging

from decimal import Decimal as D

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction as db_transaction, models
from django.utils import timezone

from zazi.core import json

from .clean import clean_b2c_transaction_details, \
    clean_stk_response, clean_balance_response

from .. import api, settings as mpesa_settings, queue
from ..models import (
    MpesaAccount, 
    MpesaTransaction, 
    MpesaAccountBalance,
    generate_id)
from ..enums import (
    IdentifierType, CommandID, ResultCode, 
    ResponseType, AccountType, MpesaTransactionStatus, 
    TransactionEntryType, MpesaTransactionCategory)

#----------------

logger = logging.getLogger(__name__)

#----------------

def process_reversal_result(data, mpesa_transaction):
    mpesa_transaction.response_payload = data
    mpesa_transaction.save()

    return ResultCode.success


def process_balance_check_result(data, mpesa_transaction):
    logger.debug(f"process_balance_check_result({data}, {mpesa_transaction})")

    with db_transaction.atomic():
        cleaned = clean_balance_response(data)
        
        logger.debug(cleaned)
        logger.debug(mpesa_transaction.sender_account)

        if cleaned.get('result_code') != ResultCode.success:
            return ResultCode.internal_failure

        balance = MpesaAccountBalance.objects\
            .get(
                request_id=mpesa_transaction.transaction_id,
                mpesa_account=mpesa_transaction.sender_account)
                    
        mpesa_transaction.response_payload = balance.response_payload = json.dumps(cleaned)
        mpesa_transaction.save()

        balance.balance_updated_at = timezone.now()
        balance.status = 1
        balance.save()

        balance_items = cleaned.get('balances') or []

        if not balance_items:
            logger.debug("Balance items empty")
            return ResultCode.internal_failure

        logger.debug(f"balance_items={balance_items}")

        linked_bank_accounts = balance\
            .mpesa_account\
            .linked_bank_accounts\
            .all()
        
        for linked_bank_account in linked_bank_accounts:
            bank_account = linked_bank_account.bank_account
            logger.debug(f"bank_account={bank_account}")

            bank_account.current_balance = 0
            bank_account.balance_items = balance_items

            for _balance in balance_items:
                bank_account.current_balance += _balance['balance']

            bank_account.save()

    return ResultCode.success


def process_b2c_result(data, mpesa_transaction):
    logger.debug(f"process_b2c_result({data}, {mpesa_transaction})")

    with db_transaction.atomic():
        transaction_details = clean_b2c_transaction_details(data)

        if not transaction_details:
            mpesa_transaction.response_payload = data
            mpesa_transaction.save()
            
            return (data.get('Result', {}).get('ResultCode') or 0)
        else:
            mpesa_transaction.response_payload = transaction_details

        logger.debug(f"process_b2c_result__transaction_details={transaction_details}")

        personal_mpesa_account = mpesa_transaction.recipient_account

        assert transaction_details['transaction_recipient_phone'] == personal_mpesa_account.identifier, (
            "recipient phone and identifier dont match"
        )

        # the mpesa transaction code
        mpesa_transaction.mpesa_receipt_number = transaction_details['transaction_id']

        # -------------

        transaction_amount = D(transaction_details.get('transaction_amount') or 0)
        transaction_charge = D(transaction_details.get('transaction_charge') or 0)

        if transaction_charge <= 0:
            if transaction_amount > 1000:
                transaction_charge = D('22.40')
            elif transaction_amount >= 50:
                transaction_charge = D('15.27')

        mpesa_transaction.transaction_amount = transaction_amount
        mpesa_transaction.transaction_charge = transaction_charge

        # -------------

        # save this so that it can be used elsewhere

        mpesa_transaction.b2c_utility_balance = D(transaction_details.get('b2c_utility_balance') or 0)
        mpesa_transaction.b2c_working_account_balance = D(transaction_details.get('b2c_working_account_balance') or 0)

        linked_bank_accounts = mpesa_transaction\
            .sender_account\
            .linked_bank_accounts\
            .all()
        for linked_bank_account in linked_bank_accounts:
            bank_account = linked_bank_account.bank_account

            logger.debug(f"bank_account={bank_account}")

            bank_account.current_balance = (
                mpesa_transaction.b2c_utility_balance +
                mpesa_transaction.b2c_working_account_balance)
            bank_account.balance_items = [
                {'account': "B2C Utility Account", 'balance': mpesa_transaction.b2c_utility_balance },
                {'account': "B2C Working Account", 'balance': mpesa_transaction.b2c_working_account_balance }
            ]
            bank_account.save()

        mpesa_transaction.save()

        if mpesa_transaction.loan_transactions.count() > 0:
            # complete after saving
            from zazi.apps.mpesa_loan.utils import process_mpesa_b2c_transaction
            process_mpesa_b2c_transaction(mpesa_transaction.transaction_id)

    return ResultCode.success


def process_c2b_mpesa_express_response(
    data, 
    organization_id=None, 
    reference=None
):
    logger.debug(f"process_c2b_mpesa_express_response({data}, {organization_id}, {reference})")
    mpesa_transaction = None

    try:
        with db_transaction.atomic():
            data = clean_stk_response(data)

            if not data:
                raise Exception("not clean")

            qs = MpesaTransaction.objects.filter(
                transaction_id=reference,
                status=MpesaTransactionStatus.PENDING,
                command_id=CommandID.C2B_PAYBILL)

            mpesa_transaction = qs.get(
                request_payload__merchant_request_id=data.get('merchant_request_id'),
                request_payload__checkout_request_id=data.get('checkout_request_id'),
                result_code__isnull=True)

            mpesa_transaction.response_payload = data

            result_code = data.get('result_code', ResultCode.internal_failure)
            mpesa_transaction.result_code = result_code

            if data.get('result_code') == ResultCode.success:
                mpesa_transaction.mpesa_receipt_number = data.get('mpesa_receipt_number')
                mpesa_transaction.status = MpesaTransactionStatus.COMPLETED

                #----------------
                # Post to SQS, listeners include Loans module

                if mpesa_transaction.transaction_category == MpesaTransactionCategory.LOAN_TRANSACTION:
                    try:
                        from zazi.apps.mpesa_loan.utils import process_mpesa_c2b_transaction
                        process_mpesa_c2b_transaction(mpesa_transaction)

                        mpesa_transaction.transaction_time = datetime.datetime\
                            .strptime(str(data.get('transaction_date')), '%Y%m%d%H%M%S')
                    except ObjectDoesNotExist as e:
                        logger.debug(e)
                        mpesa_transaction.status = MpesaTransactionStatus.FAILED
                    except Exception as e:
                        logger.exception(e)
                        mpesa_transaction.status = MpesaTransactionStatus.FAILED
                
                elif mpesa_transaction.transaction_category == MpesaTransactionCategory.IDENTITY_VERIFICATION:
                    try:
                        from zazi.apps.identity.utils import process_mpesa_c2b_transaction
                        process_mpesa_c2b_transaction(mpesa_transaction)

                        mpesa_transaction.transaction_time = datetime.datetime\
                            .strptime(str(data.get('transaction_date')), '%Y%m%d%H%M%S')
                    except ObjectDoesNotExist as e:
                        logger.debug(e)
                        mpesa_transaction.status = MpesaTransactionStatus.FAILED
                    except Exception as e:
                        logger.exception(e)
                        mpesa_transaction.status = MpesaTransactionStatus.FAILED

                else:
                    mpesa_transaction.status = MpesaTransactionStatus.FAILED

            elif data.get('result_code') == ResultCode.stk_cancelled_by_user:
                mpesa_transaction.status = MpesaTransactionStatus.CANCELLED

            else:
                mpesa_transaction.status = MpesaTransactionStatus.FAILED

            mpesa_transaction.save()

            return result_code
    except ObjectDoesNotExist as e:
        logger.exception(e)

        if mpesa_transaction:
            mpesa_transaction.result_code = ResultCode.unresolved_initiator
            mpesa_transaction.save()

        return ResultCode.unresolved_initiator

    except Exception as e:
        logger.exception(e)

        if mpesa_transaction:
            mpesa_transaction.result_code = ResultCode.internal_failure
            mpesa_transaction.save()

        return ResultCode.internal_failure


def process_c2b_validation_request(
    data, 
    organization_id=None, 
    reference=None
):
    logger.debug(f"process_c2b_validation_request({data}, {organization_id}, {reference})")
    try:
        with db_transaction.atomic():
            sender_account = MpesaAccount.objects.get(
                account_type=AccountType.PERSONAL_MPESA_ACCOUNT,
                identifier_type=IdentifierType.PERSONAL_MPESA,
                identifier=data['MSISDN'],
                is_active=True)
            recipient_account = MpesaAccount.objects.get(
                account_type=AccountType.C2B_PAYBILL_ACCOUNT,
                identifier_type=IdentifierType.BUSINESS_PAYBILL,
                identifier=data['BusinessShortCode'],
                organization__organization_id=organization_id,
                mpesa_registed_urls__reference=reference,
                is_active=True)
            
            MpesaTransaction.objects\
                .filter(
                    transaction_id=reference)\
                .update(
                    mpesa_receipt_number=data['TransID'],
                    command_id=CommandID.C2B_PAYBILL,
                    sender_account=sender_account,
                    recipient_account=recipient_account,
                    billref_number=data['BillRefNumber'],
                    invoice_number=data['InvoiceNumber'],
                    transaction_time=dateutil.parser.parse(data['TransTime']),
                    transaction_amount=D(data['TransAmount']))

            return ResultCode.success
    except ObjectDoesNotExist as e:
        logger.exception(e)
        return ResultCode.unresolved_initiator
    except Exception as e:
        logger.exception(e)
        return ResultCode.internal_failure


def process_c2b_confirmation_request(data, organization_id=None, reference=None):
    logger.debug(f"process_c2b_confirmation_request({data}, {organization_id}, {reference})")
    try:
        with db_transaction.atomic():
            qs = MpesaTransaction.objects.filter(
                command_id=CommandID.C2B_PAYBILL)

            qs = qs.filter(
                recipient_account__account_type=AccountType.C2B_PAYBILL_ACCOUNT,
                recipient_account__identifier_type=IdentifierType.BUSINESS_PAYBILL,
                recipient_account__identifier=data['BusinessShortCode'],
                recipient_account__mpesa_registed_urls__reference=reference,
                recipient_account__organization__organization_id=organization_id,
                recipient_account__is_active=True)
            
            qs = qs.filter(
                sender_account__account_type=AccountType.PERSONAL_MPESA_ACCOUNT,
                sender_account__identifier_type=IdentifierType.PERSONAL_MPESA,
                sender_account__is_active=True,
                sender_account__identifier=data['MSISDN'],
                result_code__isnull=True)

            transaction = qs.get()
            transaction.result_code = ResultCode.success
            transaction.save()

            return ResultCode.success
    except ObjectDoesNotExist as e:
        logger.exception(e)
        return ResultCode.unresolved_initiator
    except Exception as e:
        logger.exception(e)
        return ResultCode.internal_failure