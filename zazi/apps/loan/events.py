import logging

from decimal import Decimal as D

from django.utils import timezone

from zazi.core import json

from .enums import LoanTransactionType
from . import utils as api

#--------------

logger = logging.getLogger(__name__)

#--------------


def process_loan_transaction(event, context):
    for message in event["Records"]:
        logger.debug("Processing loan transaction")

        message_body = message['body']
        
        try:
            transaction_details = json.loads(message_body)
        except Exception as e:
            transaction_details = {}

            logger.debug(message)
            logger.debug(message_body)

            logger.exception(e)

        logger.debug(transaction_details)

        if not transaction_details:
            logger.debug("transaction_details has invalid value, exiting...")
            raise RuntimeError("Cannot process this transaction")

        amount = 0
        fee = 0
        repayment_amount = 0

        if transaction_type == LoanTransactionType.LOAN_DISBURSAL:
            amount = transaction_details['transaction']['amount']
            fee = transaction_details['transaction']['payment_platform']['fee']

        elif transaction_type == LoanTransactionType.LOAN_REPAYMENT:
            repayment_amount = transaction_details['transaction']['repayment_amount']
        
        loan_account_id = transaction_details['loan_account_id']
        transaction_type = transaction_details['transaction']['transaction_type']

        api.process_loan_transaction(
            loan_account_id,
            transaction_type,
            amount=amount,
            fee=fee,
            repayment_amount=repayment_amount)

