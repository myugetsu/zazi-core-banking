
from .auth import MpesaBase
from .b2b import B2B
from .b2c import B2C
from .c2b import C2B
from .balance import Balance
from .mpesa_express import MpesaExpress
from .reversal import Reversal
from .transaction_status import TransactionStatus

from zazi.core import json
from django.conf import settings

import logging
logger = logging.getLogger(__name__)

name = "mpesa"

def authenticate(
    env="sandbox",
    live_url='https://api.safaricom.co.ke',
    app_key=None, 
    app_secret=None,
    timeout=settings.MPESA_REQUESTS_TIMEOUT_SECONDS
):
    logger.info("authenticating for %s" % app_key)

    authentication_token = MpesaBase(
        live_url=live_url,
        env=env,
        app_key=app_key,
        app_secret=app_secret,
        timeout=timeout
    ).authenticate()

    logger.info("Successfully authenticated for %s" % app_key)

    return authentication_token


def b2b_transact(
    env="sandbox",
    live_url='https://api.safaricom.co.ke',
    app_key=None, 
    app_secret=None,
    initiator=None,
    security_credential=None,
    command_id=None,
    sender_identifier_type=None,
    receiver_identifier_type=None,
    amount=None,
    party_a=None,
    party_b=None,
    remarks=None,
    account_reference=None,
    queue_timeout_url=None,
    result_url=None,
    timeout=settings.MPESA_REQUESTS_TIMEOUT_SECONDS
):
    logger.info("Successfully B2B transaction for %s" % app_key)
    logger.info({
        "env": env,
        "party_a": party_a,
        "party_b": party_b,
        "amount": amount,
    })

    response = B2B(
        live_url=live_url,
        env=env,
        app_key=app_key,
        app_secret=app_secret,
        timeout=timeout
    ).transact(
        initiator=initiator, 
        security_credential=security_credential, 
        command_id=command_id, 
        sender_identifier_type=sender_identifier_type,
        receiver_identifier_type=receiver_identifier_type, 
        amount=amount, 
        party_a=party_a, 
        party_b=party_b, 
        remarks=remarks,
        account_reference=account_reference, 
        queue_timeout_url=queue_timeout_url, 
        result_url=result_url)

    logger.info("Successful B2B transaction for %s" % app_key)

    return response


def c2b_register_url(
    env="sandbox",
    live_url='https://api.safaricom.co.ke',
    app_key=None, 
    app_secret=None,
    shortcode=None,
    response_type=None,
    confirmation_url=None,
    validation_url=None,
    timeout=settings.MPESA_REQUESTS_TIMEOUT_SECONDS
):
    logger.info("Registering url for %s" % app_key)
    logger.info({
        "env": env,
        "shortcode": shortcode,
    })

    response = C2B(
        live_url=live_url,
        env=env,
        app_key=app_key,
        app_secret=app_secret,
        timeout=timeout
    ).register(
        shortcode=shortcode,
        response_type=response_type,
        confirmation_url=confirmation_url,
        validation_url=validation_url,
    )

    logger.info("Successfully registered url for %s" % app_key)

    return response


def b2c_transact(
    env="sandbox",
    live_url='https://api.safaricom.co.ke',
    app_key=None, 
    app_secret=None,
    initiator_name=None,
    security_credential=None,
    command_id=None,
    amount=None,
    party_a=None,
    party_b=None,
    remarks=None,
    account_reference=None,
    queue_timeout_url=None,
    result_url=None,
    occassion=None,
    timeout=settings.MPESA_REQUESTS_TIMEOUT_SECONDS
):
    logger.info("Sending cash for %s" % app_key)
    logger.info(json.dumps({
        "env": env,
        "amount": amount,
        "party_a": party_a,
        "party_b": party_b,
    }))

    return B2C(
        live_url=live_url,
        env=env,
        app_key=app_key,
        app_secret=app_secret,
        timeout=timeout
    ).transact(
        initiator_name=initiator_name, 
        security_credential=security_credential, 
        command_id=command_id, 
        amount=amount, 
        party_a=party_a, 
        party_b=party_b, 
        remarks=remarks,
        queue_timeout_url=queue_timeout_url, 
        result_url=result_url,
        occassion=occassion
    )


def check_balance(
    env="sandbox",
    live_url='https://api.safaricom.co.ke',
    app_key=None, 
    app_secret=None, 
    initiator=None,
    security_credential=None,
    command_id=None,
    identifier_type=None,
    party_a=None,
    remarks=None,
    queue_timeout_url=None,
    result_url=None,
    timeout=settings.MPESA_REQUESTS_TIMEOUT_SECONDS
):
    return Balance(
        live_url=live_url,
        env=env,
        app_key=app_key,
        app_secret=app_secret,
        timeout=timeout
    ).get_balance(
        initiator=initiator, 
        security_credential=security_credential, 
        command_id=command_id, 
        identifier_type=identifier_type, 
        party_a=party_a, 
        remarks=remarks,
        queue_timeout_url=queue_timeout_url, 
        result_url=result_url
    )



def mpesa_express_stk_push(
    env="sandbox",
    live_url='https://api.safaricom.co.ke',
    app_key=None, 
    app_secret=None, 
    business_shortcode=None, 
    passcode=None, 
    amount=None, 
    callback_url=None, 
    reference_code=None,
    phone_number=None, 
    description=None,
    timeout=settings.MPESA_REQUESTS_TIMEOUT_SECONDS
):
    return MpesaExpress(
        live_url=live_url,
        env=env,
        app_key=app_key,
        app_secret=app_secret,
        timeout=timeout
    ).stk_push(
        business_shortcode=business_shortcode,
        passcode=passcode,
        amount=amount,
        callback_url=callback_url,
        reference_code=reference_code,
        phone_number=phone_number,
        description=description
    )



def mpesa_express_query(
    env="sandbox",
    live_url='https://api.safaricom.co.ke',
    app_key=None, 
    app_secret=None, 
    business_shortcode=None, 
    passcode=None, 
    checkout_request_id=None,
    timeout=settings.MPESA_REQUESTS_TIMEOUT_SECONDS
):
    return MpesaExpress(
        live_url=live_url,
        env=env,
        app_key=app_key,
        app_secret=app_secret,
        timeout=timeout
    ).query(
        business_shortcode=business_shortcode,
        passcode=passcode,
        checkout_request_id=checkout_request_id
    )


def transaction_reverse(
    env="sandbox",
    live_url='https://api.safaricom.co.ke',
    app_key=None, 
    app_secret=None, 
    receiver_party=None,
    initiator=None,
    security_credential=None,
    command_id=None,
    transaction_id=None,
    receiver_identifier_type=None,
    amount=None,
    queue_timeout_url=None,
    result_url=None,
    remarks=None,
    occassion=None,
    timeout=settings.MPESA_REQUESTS_TIMEOUT_SECONDS
):
    return Reversal(
        live_url=live_url,
        env=env,
        app_key=app_key,
        app_secret=app_secret,
        timeout=timeout
    ).reverse(
        initiator=initiator, 
        security_credential=security_credential, 
        command_id=command_id, 
        transaction_id=transaction_id,
        receiver_party=receiver_party,
        receiver_identifier_type=receiver_identifier_type,  
        remarks=remarks,
        occassion=occassion,
        queue_timeout_url=queue_timeout_url, 
        result_url=result_url
    )


def check_transaction_status(
    env="sandbox",
    live_url='https://api.safaricom.co.ke',
    app_key=None, 
    app_secret=None, 
    identifier_type=None,
    initiator=None,
    party_a=None,
    remarks=None,
    queue_timeout_url=None,
    result_url=None,
    timeout=settings.MPESA_REQUESTS_TIMEOUT_SECONDS
):
    return TransactionStatus(
        live_url=live_url,
        env=env,
        app_key=app_key,
        app_secret=app_secret,
        timeout=timeout
    ).check_transaction_status(
        initiator=initiator, 
        identifier_type=identifier_type, 
        party_a=party_a, 
        remarks=remarks,
        queue_timeout_url=queue_timeout_url, 
        result_url=result_url
    )