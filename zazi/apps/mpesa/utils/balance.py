from decimal import Decimal as D

from django.conf import settings
from django.db import transaction as db_transaction
from django.utils import timezone
from django.urls import reverse_lazy
from django.shortcuts import get_object_or_404

from zazi.core.utils import get_absolute_url, get_encrypted_text

from .. import api
from ..models import (
    MpesaAccount, 
    MpesaAccountBalance, 
    MpesaAccountRegisteredURL,
    MpesaAPIAccount, 
    MpesaTransaction,
    MpesaOrganization, 
    generate_id)
from ..enums import \
    IdentifierType, AccountType, CommandID, \
    ResultCode, MpesaTransactionStatus
from .transaction import get_mpesa_webhook_url

#----------------------

import logging
logger = logging.getLogger(__name__)

#----------------------


def request_check_balance(
    mpesa_account=None,
    organization_id=None,
    short_code=None,
    remarks=None
):
    logger.debug(f"request_check_balance({mpesa_account})")
    
    with db_transaction.atomic():
        if mpesa_account is None:
            mpesa_api_account = MpesaAPIAccount.objects\
                .get(
                    organization__organization_id=organization_id,
                    linked_account__identifier=short_code,
                    linked_account__identifier_type=IdentifierType.BUSINESS_PAYBILL)

            mpesa_account = mpesa_api_account.linked_account
        else:
            mpesa_api_account = MpesaAPIAccount.objects\
                .get(linked_account=mpesa_account)
            
        if organization_id is None:
            organization_id = mpesa_api_account.organization.organization_id

        transaction_id = generate_id()
        time = timezone.now()

        if mpesa_api_account.security_credential:
            try:
                security_credential = get_encrypted_text(
                    mpesa_api_account.security_credential,
                    function_name="zazi-certificate-microservice-dev-encrypt_text")
                if not security_credential:
                    raise Exception("Error accessing securty credentials for M-Pesa account %s" % mpesa_api_account.account_id)
            except Exception as e:
                logger.exception(e)
                return
        else:
            logger.debug(f"security_credential for {mpesa_account} is invalid.")
            return

        request_payload = api.check_balance(
            env="production" if mpesa_api_account.in_production else "sandbox",
            app_key=mpesa_api_account.consumer_key,
            app_secret=mpesa_api_account.consumer_secret,
            initiator=mpesa_api_account.username,
            security_credential=security_credential,
            command_id=CommandID.UTILITY_ACCOUNT_BALANCE,
            identifier_type=IdentifierType.BUSINESS_PAYBILL,
            party_a=mpesa_account.identifier,
            remarks=(remarks or f"Mpesa balance request by {mpesa_account.identifier}"),
            result_url=get_mpesa_webhook_url('mpesa:mpesa_balance_check_result_url', kwargs={
                "organization_id": organization_id,
                "reference": transaction_id
            }),
            queue_timeout_url=get_mpesa_webhook_url('mpesa:mpesa_balance_check_queue_timeout_url', kwargs={
                "organization_id": organization_id,
                "reference": transaction_id
            }))

        MpesaAccountBalance.objects.create(
            request_id=transaction_id,
            mpesa_account=mpesa_account,
            status=MpesaAccountBalance.PENDING,
            request_payload=request_payload,
            balance_requested_at=time)

        return MpesaTransaction.objects.create(
            transaction_id=transaction_id,
            sender_account=mpesa_account,
            command_id=CommandID.UTILITY_ACCOUNT_BALANCE,
            status=MpesaTransactionStatus.PENDING,
            initiated_at=timezone.now(),
            request_payload=request_payload)
