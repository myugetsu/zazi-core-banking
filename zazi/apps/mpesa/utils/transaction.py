import logging

from django.db import transaction as db_transaction
from django.conf import settings
from django.utils import timezone
from django.urls import reverse_lazy

from zazi.core.utils import get_absolute_url, get_encrypted_text

from .. import api
from ..models import (
    MpesaAccount, 
    MpesaAccountBalance, 
    MpesaAccountRegisteredURL,
    MpesaAPIAccount, 
    MpesaTransaction,
    generate_id)
from ..enums import IdentifierType, CommandID, ResultCode, MpesaTransactionStatus

logger = logging.getLogger(__name__)


def get_mpesa_webhook_url(url_name, kwargs=None, endpoint=None):
    logger.debug(f'get_mpesa_webhook_url({url_name}, kwargs={kwargs}, endpoint={endpoint})')

    return get_absolute_url(url_name, kwargs=kwargs, endpoint=settings.MPESA_WEBHOOKS_URL)


def request_b2b_transaction(
    sender_short_code,
    receiver_short_code,
    amount,
    user,
    mpesa_receipt_number=None,
    account_reference=None,
    transaction_category=None,
    command_id=CommandID.B2B_BUSINESS_TO_BUSINESS_TRANSFER,
    remarks=None,
): 
    with db_transaction.atomic():
        sender_account = MpesaAPIAccount.objects.get(
            organization__owner=user,
            identifier=sender_short_code, 
            identifier_type=IdentifierType.BUSINESS_PAYBILL)
        recipient_account = MpesaAPIAccount.objects.get(
            organization__owner=user,
            identifier=receiver_short_code, 
            identifier_type=IdentifierType.BUSINESS_PAYBILL)

        return MpesaTransaction.objects.create(
            transaction_id=generate_id(),
            command_id=command_id,
            mpesa_receipt_number=mpesa_receipt_number,
            sender_account=sender_account,
            recipient_account=recipient_account,
            transaction_time=timezone.now(),
            transaction_amount=amount)


def request_b2c_transaction(
    organization_id,
    sender_short_code,
    receiver_phone_number,
    amount,
    user,
    transaction_id=None,
    account_reference=None,
    transaction_category=None,
    command_id=CommandID.B2C_BUSINESS_PAYMENT,
    remarks=None,
): 
    logger.info("request_b2c_transaction %s %s %s %s" % (
        organization_id,
        sender_short_code,
        receiver_phone_number,
        amount
    ))

    with db_transaction.atomic():
        sender_account = MpesaAccount.objects.get(
            organization__owner=user,
            organization__organization_id=organization_id,
            identifier=sender_short_code, 
            identifier_type=IdentifierType.BUSINESS_PAYBILL)
        recipient_account = MpesaAccount.objects.get(
            identifier=receiver_phone_number, 
            identifier_type=IdentifierType.PERSONAL_MPESA)

        transaction_id = transaction_id or generate_id()
        
        mpesa_api_account = sender_account.api_account
        queue_timeout_url = get_mpesa_webhook_url('mpesa:mpesa_b2c_queue_timeout_url', kwargs={
            "organization_id": organization_id,
            "reference": transaction_id
        })
        result_url = get_mpesa_webhook_url('mpesa:mpesa_b2c_result_url', kwargs={
            "organization_id": organization_id,
            "reference": transaction_id
        })

        security_credential = get_encrypted_text(
            mpesa_api_account.security_credential,
            function_name="zazi-certificate-microservice-dev-encrypt_text")
        if not security_credential:
            raise Exception("Error accessing securty credentials for M-Pesa account %s" % mpesa_api_account.account_id)
        else:
            logger.info("Security credential received for %s" % sender_account.account_id)
        
        request_payload = api.b2c_transact(
            env="production" if sender_account.api_account.in_production else "sandbox",
            app_key=mpesa_api_account.consumer_key,
            app_secret=mpesa_api_account.consumer_secret,
            initiator_name=mpesa_api_account.username,
            security_credential=security_credential,
            command_id=command_id,
            party_a=sender_account.identifier,
            party_b=recipient_account.identifier,
            amount=amount,
            remarks=remarks,
            account_reference=account_reference,
            queue_timeout_url=queue_timeout_url,
            result_url=result_url)

        transaction = MpesaTransaction.objects\
            .create(
                command_id=command_id,
                transaction_category=transaction_category,
                transaction_id=transaction_id,
                sender_account=sender_account,
                result_code=ResultCode.success,
                status=MpesaTransactionStatus.PENDING,
                initiated_at=timezone.now(),
                recipient_account=recipient_account)

        if request_payload:
            logger.info(request_payload)

            transaction.request_payload = {
                "conversation_id": request_payload["ConversationID"],
                "originator_conversation_id": request_payload["OriginatorConversationID"],
                "response_code": ResultCode(int(request_payload["ResponseCode"])),
                "response_description": request_payload["ResponseDescription"]
            }
            transaction.save()
        else:
            transaction.request_payload = request_payload
            transaction.save()

        return transaction

def request_mpesa_express_stk_push(
    organization_id,
    short_code,
    phone_number,
    amount,
    transaction_category=None,
    reference_code=None,
    description=None,
):
    with db_transaction.atomic():
        business_account = MpesaAccount.objects.get(
            organization__organization_id=organization_id,
            identifier=short_code, 
            identifier_type=IdentifierType.BUSINESS_PAYBILL)
        
        personal_account = MpesaAccount.objects.get(
            identifier=phone_number, 
            identifier_type=IdentifierType.PERSONAL_MPESA)
        lipa_na_mpesa_account = business_account.lipa_na_mpesa_accounts.first()
        
        reference = generate_id()
        request_payload = api.mpesa_express_stk_push(
            env="production" if business_account.api_account.in_production else "sandbox",
            app_key=business_account.api_account.consumer_key,
            app_secret=business_account.api_account.consumer_secret,
            business_shortcode=short_code,
            passcode=lipa_na_mpesa_account.pass_code,
            amount=amount,
            callback_url=get_mpesa_webhook_url('mpesa:mpesa_c2b_stk_push_callback_url', kwargs={
                "organization_id": organization_id,
                "reference": reference
            }),
            reference_code=reference_code or reference,
            phone_number=phone_number,
            description=description)

        transaction = MpesaTransaction.objects.create(
            transaction_id=reference,
            command_id=CommandID.C2B_PAYBILL,
            transaction_category=transaction_category,
            sender_account=personal_account,
            recipient_account=business_account,
            status=MpesaTransactionStatus.PENDING,
            initiated_at=timezone.now(),
            transaction_amount=amount,
            request_payload=request_payload)
        
        if request_payload.get("errorCode") is None:
            transaction.request_payload = {
                "merchant_request_id": request_payload["MerchantRequestID"],
                "checkout_request_id": request_payload["CheckoutRequestID"],
                "response_code": ResultCode(int(request_payload["ResponseCode"])),
                "response_description": request_payload["ResponseDescription"],
                "customer_message": request_payload["CustomerMessage"]
            }
            transaction.save()
        else:
            transaction.request_payload = request_payload
            transaction.save()

            logger.debug(request_payload)

        return transaction


def request_transaction_reverse(
    transaction_id,
    mpesa_user,
    remarks=None,
    occassion=None
):
    with db_transaction.atomic():
        organization_id = mpesa_user.organization.organization_id
        transaction = MpesaTransaction.objects.get(
            transaction_id=transaction_id)
        
        response = api.transaction_reverse(
            env="production" if transaction.sender_account.in_production else "sandbox",
            app_key=None, 
            app_secret=None, 
            receiver_party=None,
            initiator=None,
            security_credential=None,
            command_id=None,
            transaction_id=None,
            receiver_identifier_type=None,
            amount=None,
            result_url=get_mpesa_webhook_url('mpesa_balance_check_result_url', kwargs={
                "organization_id": organization_id,
                "reference": transaction.transaction_id
            }),
            queue_timeout_url=get_mpesa_webhook_url('mpesa_balance_check_queue_timeout_url', kwargs={
                "organization_id": organization_id,
                "reference": transaction.transaction_id
            }),
            remarks=remarks,
            occassion=occassion)
        transaction_reference = generate_id()

        return MpesaTransaction.objects.create(
            command_id=CommandID.UTILITY_TRANSACTION_REVERSAL,
            transaction_id=transaction_reference,
            initiator=mpesa_user,
            status=MpesaTransactionStatus.PENDING,
            initiated_at=timezone.now(),
            request_payload=response)
        

def request_check_transaction_status(
    transaction_id, 
    mpesa_user,
    remarks=None
):
    with db_transaction.atomic():
        organization_id = mpesa_user.organization.organization_id
        transaction = MpesaTransaction.objects.get(
            transaction_id=transaction_id)
        response = api.check_transaction_status(
            env="production" if transaction.sender_account.in_production else "sandbox",
            app_key=transaction.api_account.consumer_key, 
            app_secret=transaction.api_account.consumer_secret, 
            identifier_type=transaction.sender_account.identifier_type,
            initiator=transaction.initiator.username,
            party_a=transaction.sender_account.identifier,
            remarks=remarks,
            result_url=get_mpesa_webhook_url('mpesa_check_status_result_url', kwargs={
                "organization_id": organization_id,
                "reference": transaction.mpesa_receipt_number
            }),
            queue_timeout_url=get_mpesa_webhook_url('mpesa_check_status_queue_timeout_url', kwargs={
                "organization_id": organization_id,
                "reference": transaction.mpesa_receipt_number
            }))

        transaction_reference = generate_id()

    return MpesaTransaction.objects.create(
            command_id=CommandID.UTILITY_TRANSACTION_STATUS_QUERY,
            transaction_id=transaction_reference,
            initiator=mpesa_user,
            status=MpesaTransactionStatus.PENDING,
            initiated_at=timezone.now(),
            request_payload=response)

