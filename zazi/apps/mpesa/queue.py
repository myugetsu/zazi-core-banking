import logging

from django.utils import timezone
from django.conf import settings

from zazi.core import queue, json

#--------------

logger = logging.getLogger(__name__)

#--------------

try:
    MPESA_VERIFICATION_AMOUNT = settings.MPESA_VERIFICATION_AMOUNT
except AttributeError:
    MPESA_VERIFICATION_AMOUNT = 1

def notify_verify_mpesa_account_request(loan_account):
    logger.info(f"notify_verify_mpesa_account_request({loan_account.account_id})")

    time_now = timezone.now()
    logger.info(dict(
        transaction_type="MPESA_VERIFICATION",
        initiated_at=time_now,
        status="PENDING_PROCESSING",
        amount=settings.MPESA_VERIFICATION_AMOUNT))

    response = queue.send_sqs_message("mpesa_verification_request", json.dumps({
        'loan_transaction_id': loan_transaction.transaction_id,
        'loan_account_id': loan_account.account_id,
        'repayment_amount': repayment_amount
    }))
    logger.debug(response)

    return loan_transaction


def notify_c2b_mpesa_express_response(mpesa_transaction, personal_mpesa_account, business_paybill_account, amount):
    logger.info("Notifying c2b mpesa express response")

    # -----------

    payload = {
        'business_mpesa_account_id': business_paybill_account.account_id,
        'personal_mpesa_account_id': personal_mpesa_account.account_id,
        'mpesa_transaction_id': mpesa_transaction.transaction_id,
        'transaction_type': 'c2b',
        'amount': amount
    }
    logger.debug(payload)

    # -----------

    return queue.send_sqs_message('mpesa_c2b_requests', json.dumps(payload))


def notify_b2c_mpesa_response(mpesa_transaction, personal_mpesa_account, business_paybill_account, transaction_amount, transaction_charge):
    logger.info("Notifying b2c response")

    # -----------

    payload = {
        'business_mpesa_account_id': business_paybill_account.account_id,
        'personal_mpesa_account_id': personal_mpesa_account.account_id,
        'mpesa_transaction_id': mpesa_transaction.transaction_id,
        'transaction_type': 'b2c',
        'transaction_amount': transaction_amount,
        'transaction_charge': transaction_charge
    }
    logger.debug(payload)

    # -----------

    return queue.send_sqs_message('mpesa_b2c_requests', json.dumps(payload))