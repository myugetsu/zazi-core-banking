import logging


from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction as db_transaction
from django.shortcuts import get_object_or_404

from zazi.apps.loan.models import LoanAccount
from zazi.core.utils import generate_id, get_absolute_url

from .. import api
from ..enums import IdentifierType, ResponseType, AccountType
from ..models import (
    MpesaOrganization,
    MpesaAccountRegisteredURL,
    MpesaAPIAccount)

from .account import create_personal_account

User = get_user_model()
logger = logging.getLogger(__name__)


def get_mpesa_webhook_url(url_name, kwargs=None, endpoint=None):
    return get_absolute_url(url_name, kwargs=kwargs, endpoint=settings.MPESA_PROXY_URL)


def request_authentication(user, organization_id, short_code):
    """
    Request for an authentication token from Safaricom's MPesa API
    """
    mpesa_api_account = get_object_or_404(
        MpesaAPIAccount.objects.filter(
            organization__owner=user,
            linked_account__identifier=short_code,
            organization__organization_id=organization_id
        ))
    
    return api.authenticate(
        env="production" if mpesa_api_account.in_production else "sandbox",
        app_key=mpesa_api_account.consumer_key, 
        app_secret=mpesa_api_account.consumer_secret)


def request_c2b_register_urls(
    organization_id,
    short_code,
    validation_url=None,
    confirmation_url=None,
    response_type=ResponseType.cancelled
): 
    with db_transaction.atomic():
        mpesa_api_account = MpesaAPIAccount.objects.get(
            organization__organization_id=organization_id,
            linked_account__identifier=short_code, 
            linked_account__account_type=AccountType.C2B_PAYBILL_ACCOUNT, 
            linked_account__identifier_type=IdentifierType.BUSINESS_PAYBILL)

        reference = generate_id()

        if not confirmation_url:
            confirmation_url = get_mpesa_webhook_url('mpesa:mpesa_c2b_confirmation_url', kwargs={
                "organization_id": organization_id,
                "reference": reference
            })

        if not validation_url:
            validation_url = get_mpesa_webhook_url('mpesa:mpesa_c2b_validation_url', kwargs={
                "organization_id": organization_id,
                "reference": reference
            })

        request_payload = api.c2b_register_url(
            env="production" if mpesa_api_account.in_production else "sandbox",
            app_key=mpesa_api_account.consumer_key,
            app_secret=mpesa_api_account.consumer_secret,
            shortcode=short_code,
            response_type=response_type,
            validation_url=validation_url,
            confirmation_url=confirmation_url)

        if request_payload.get("ResponseDescription") == "success":
            logger.debug({
                "message": "URL registed successfully",
                "short_code": short_code
            })
            return MpesaAccountRegisteredURL.objects.create(
                reference=reference,
                mpesa_account=mpesa_api_account.linked_account,
                response_type=response_type,
                request_payload=request_payload,
                validation_url=validation_url,
                confirmation_url=confirmation_url)
        else:
            _d = {"message": "Error registering URL"}
            _d.update(request_payload)
            logger.debug(_d)
