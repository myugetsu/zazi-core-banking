import logging

from zazi.core import json
from . import utils as api

#--------------

logger = logging.getLogger(__name__)

#--------------

def process_loan_application(event, context):
    """
    We analyze the loan request, and send 
    """
    for message in event["Records"]:
        message_body = message['body']
        logger.debug(message_body)

        try:
            try:
                transaction_details = json.loads(message_body)
            except Exception as e:
                transaction_details = {}

                logger.exception(e)

            logger.debug('transaction_details')
            logger.debug(transaction_details)
        
            if not transaction_details:
                raise RuntimeError("Cannot process this transaction")

            api.process_loan_application(**transaction_details)

            logger.debug("finished running process_loan_application()")
        except Exception as e:
            logger.exception(e)

            logger.debug(f"failed process_loan_repayment_request({message})")


def process_loan_repayment_request(event, context):
    """
    The Loan's Module makes a loan repayment request, we analyze the Loan 
    account for any credit dues then makes a request to mpesa for repayment.

    AWS specific
    """
    for message in event["Records"]:
        message_body = message['body']
        logger.debug(message_body)

        try:
            try:
                transaction_details = json.loads(message_body)
            except Exception as e:
                transaction_details = {}

                logger.exception(e)

            logger.debug('transaction_details')
            logger.debug(transaction_details)
            
            # process loan
            api.process_loan_repayment_request(**transaction_details)

            logger.debug(f"finished process_loan_repayment_request({message})")
        except Exception as e:
            logger.exception(e)

            logger.debug(f"failed process_loan_repayment_request({message})")


# ------------- 
# After the requests above, M-Pesa responds, and we process below


def process_mpesa_b2c_transaction(event, context):
    logger.info("calling process_mpesa_b2c_transaction()")
    
    for message in event["Records"]:
        message_body = message['body']
        logger.debug(message_body)

        try:
            try:
                transaction_details = json.loads(message_body)
            except Exception as e:
                transaction_details = {}

                logger.exception(e)

            logger.debug('transaction_details')
            logger.debug(transaction_details)

            api.process_mpesa_b2c_transaction(**transaction_details)
        except Exception as e:
            logger.exception(e)

            logger.debug(f"failed process_mpesa_b2c_transaction({message})")


def process_mpesa_c2b_transaction(event, context):
    logger.info("calling process_mpesa_c2b_transaction()")
    
    for message in event["Records"]:
        message_body = message['body']

        logger.debug(message_body)

        try:
            try:
                transaction_details = json.loads(message_body)
            except Exception as e:
                transaction_details = {}

                logger.exception(e)

            logger.debug('transaction_details')
            logger.debug(transaction_details)

            api.process_mpesa_c2b_transaction(**transaction_details)
        except Exception as e:
            logger.exception(e)

            logger.debug(f"failed process_mpesa_c2b_transaction({message})")

