from decimal import Decimal as D

from django.db import transaction as db_transaction
from django.shortcuts import get_object_or_404

from zazi.core.utils import generate_id

from ..models import MpesaOrganization, MpesaAccount
from ..enums import IdentifierType, AccountType, DocumentType, MpesaC2BAPIType, MpesaTransactionCategory

from .transaction import request_b2c_transaction, request_mpesa_express_stk_push

import logging
logger = logging.getLogger(__name__)

def get_active_b2c_account(organization):
    logger.debug(f"get_active_b2c_account(organization={organization})")

    return MpesaAccount.objects.get(
        organization=organization,
        account_type=AccountType.B2C_BULK_PAYMENTS_ACCOUNT,
        identifier_type=IdentifierType.BUSINESS_PAYBILL,
        is_active=True)


def get_active_c2b_account(organization):
    logger.debug(f"get_active_c2b_account(organization={organization})")

    mpesa_account = MpesaAccount.objects.get(
        organization=organization,
        account_type=AccountType.C2B_PAYBILL_ACCOUNT,
        identifier_type=IdentifierType.BUSINESS_PAYBILL,
        is_active=True)

    return mpesa_account


@db_transaction.atomic()
def create_personal_account(organization_id, phone_number):
    organization = get_object_or_404(MpesaOrganization, organization_id=organization_id)
    
    (mpesa_account, _) = MpesaAccount.objects.get_or_create(
        identifier=phone_number,
        identifier_type=IdentifierType.PERSONAL_MPESA,
        account_type=AccountType.PERSONAL_MPESA_ACCOUNT,
        organization=organization,
        is_active=True)

    return mpesa_account


def b2c_transaction(personal_mpesa_account, amount, business_paybill_b2c_account=None, organization=None, transaction_category=None):
    logger.debug(f"mpesa_loan_request({personal_mpesa_account}, {amount}, {business_paybill_b2c_account}, {organization})")

    with db_transaction.atomic():
        if organization is None:
            organization = personal_mpesa_account.organization

        logger.info({
            "message": "Request mpesa_loan_request",
            "personal_mpesa_account": personal_mpesa_account.identifier, 
            "organization": organization,
            "amount": amount })
        
        if business_paybill_b2c_account is None:
            business_paybill_b2c_account = get_active_b2c_account(organization)
        
        logger.info(f"Active b2c account {business_paybill_b2c_account.account_id}")

        mpesa_transaction = request_b2c_transaction(
            organization.organization_id,
            business_paybill_b2c_account.identifier,
            personal_mpesa_account.identifier,
            int(D(amount)),
            organization.owner,
            transaction_category=transaction_category,
            remarks=f"Mpesa loan request by {personal_mpesa_account.identifier}")

        return mpesa_transaction


def request_mpesa_identity_verification(phone_number):
    personal_mpesa_account = MpesaAccount.objects.get(
        identifier=phone_number,
        identifier_type=IdentifierType.PERSONAL_MPESA,
        account_type=AccountType.PERSONAL_MPESA_ACCOUNT)

    amount = 1

    mpesa_transaction = c2b_transaction(
        personal_mpesa_account, 
        amount,
        transaction_category=MpesaTransactionCategory.IDENTITY_VERIFICATION)

    return mpesa_transaction


def c2b_transaction(
    personal_mpesa_account, 
    amount, 
    business_paybill_c2b_account=None, 
    organization=None, 
    mpesa_c2b_api_type=MpesaC2BAPIType.MPESA_EXPRESS_STK_PUSH,
    transaction_category=None
):
    """
    Given a personal mpesa account and a repayment amount, request 
    M-Pesa to send the user an Express STK Push repayment
    """
    logger.debug(f"mpesa_loan_repayment_request({personal_mpesa_account}, {amount})")

    if organization is None:
        organization = personal_mpesa_account.organization

    logger.info({
        "message": "mpesa_loan_repayment_request",
        "organization": organization, 
        "personal_mpesa_account": personal_mpesa_account.identifier })

    with db_transaction.atomic():
        if business_paybill_c2b_account is None:
            business_paybill_c2b_account = get_active_c2b_account(organization)

        logger.info({
            "message": "Active b2c account",
            "c2b_account_account_id": business_paybill_c2b_account.account_id })

        if mpesa_c2b_api_type == MpesaC2BAPIType.MPESA_EXPRESS_STK_PUSH:
            mpesa_transaction = request_mpesa_express_stk_push(
                organization.organization_id,
                business_paybill_c2b_account.identifier,
                personal_mpesa_account.identifier,
                int(D(amount)),
                transaction_category=transaction_category,
                reference_code=generate_id(),
                description="Request for loan repayment")
        else:
            # We will send an SMS to the personal mpesa phone number
            # with details on how to send an mpesa to our paybill
            pass

        return mpesa_transaction

