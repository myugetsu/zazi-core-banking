import logging

from decimal import Decimal as D
from django.utils import timezone

from zazi.core import queue, json

from .enums import LoanTransactionType, LoanTransactionStatus, PaymentPlatform
from .models import LoanTransaction, LoanApplication

#--------------

logger = logging.getLogger(__name__)

#--------------


def notify_loan_repayment_request(loan_account, repayment_amount):
    logger.info(f"notify_loan_repayment_request({loan_account.account_id}, {repayment_amount})")

    time_now = timezone.now()
    loan_transaction = LoanTransaction.objects.create(
        transaction_type=LoanTransactionType.LOAN_REPAYMENT,
        loan_account=loan_account,
        initiated_at=time_now,
        status=LoanTransactionStatus.PENDING_PROCESSING,
        amount=repayment_amount)
    logger.info(dict(
        transaction_type="LOAN_REPAYMENT",
        loan_account=loan_account,
        initiated_at=time_now,
        status="PENDING_PROCESSING",
        amount=repayment_amount))

    response = queue.send_sqs_message("loan_repayments", json.dumps({
        'loan_transaction_id': loan_transaction.transaction_id,
        'loan_account_id': loan_account.account_id,
        'repayment_amount': repayment_amount
    }))
    logger.debug(response)

    return loan_transaction


def notify_loan_application(loan_profile, loan_amount):
    logger.info(f"notify_loan_application({loan_profile.profile_id}, {loan_amount})")

    loan_application = LoanApplication.objects.create(
        loan_profile=loan_profile,
        applied_at=timezone.now(),
        payment_platform=PaymentPlatform.MPESA,
        amount=D(loan_amount))

    response = queue.send_sqs_message("loan_requests", json.dumps({
        'loan_application_id': loan_application.application_id
    }))

    logger.debug(response)

    return loan_application
