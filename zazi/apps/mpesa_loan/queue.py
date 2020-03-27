import logging

from decimal import Decimal as D

from zazi.core import json
from zazi.apps.loan.enums import PaymentPlatform, LoanTransactionType

from zazi.core import queue

#--------------

logger = logging.getLogger(__name__)

#--------------

def notify_successful_loan_disbursal_transaction(
    loan_account, 
    transaction_amount,
    transaction_charge,
    mpesa_transaction_id
):
    logger.debug('notify_successful_loan_disbursal_transaction')
    logger.debug({
        'mpesa_transaction_id': mpesa_transaction_id,
        'transaction_type': LoanTransactionType.LOAN_DISBURSAL,
        'transaction_amount': transaction_amount,
        'transaction_charge': transaction_charge,
        'loan_account': loan_account.account_id,
        'platform': 'mpesa'
    })

    response = queue.send_sqs_message("loan_transactions_processor", json.dumps({
        'loan_account_id': loan_account.account_id,
        'transaction': {
            'transaction_type': LoanTransactionType.LOAN_DISBURSAL,            
            'amount': transaction_amount,
            'payment_platform': {
                'fee': transaction_charge,
                'type': PaymentPlatform.MPESA,
                'transaction_id': mpesa_transaction_id
            }
        }
    }))

    logger.debug(response)


def notify_successful_loan_repayment_transaction(
    loan_account, 
    repayment_amount,
    mpesa_transaction_id
):
    logger.debug('notify_successful_loan_repayment_transaction')
    logger.debug({
        'mpesa_transaction_id': mpesa_transaction_id,
        'transaction_type': LoanTransactionType.LOAN_REPAYMENT,
        'loan_account': loan_account.account_id, 
        'repayment_amount': repayment_amount,
        'platform': 'mpesa'
    })

    response = queue.send_sqs_message("loan_transactions_processor", json.dumps({
        'loan_account_id': loan_account.account_id,
        'transaction': {
            'transaction_type': LoanTransactionType.LOAN_REPAYMENT,
            'repayment_amount': repayment_amount,
            'payment_platform': {
                'type': PaymentPlatform.MPESA,
                'transaction_id': mpesa_transaction_id
            }
        }
    }))

    logger.debug(response)
