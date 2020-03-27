from django.db import transaction as db_transaction

from zazi.apps.loan.models import \
    LoanAccount, LoanTransaction, LoanTransactionType, LoanTransactionStatus

from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from .entries import make_double_ledger_entry

from ..models import (
    LoanLedgerAccount , LoanLedgerAccountType
)

#--------------

import logging
logger = logging.getLogger(__name__)

#--------------


def book_identity_verification_amount(identity, amount):
    logger.info(f"book_identity_verification_amount({identity}, {amount})")
    
    with db_transaction.atomic():
        loan_account = LoanAccount.objects\
            .filter(loan_profile__user_account__identities=identity)\
            .first()
        
        loan_transaction = LoanTransaction.objects\
            .create(
                loan_account=loan_account, 
                amount=amount,
                transaction_type=LoanTransactionType.LOAN_LIABILITY,
                initiated_at=timezone.now(),
                processed_at=timezone.now(),
                posted_at=timezone.now(),
                status=LoanTransactionStatus.PROCESSED)

        entries = make_double_ledger_entry(loan_transaction, amount)

        #---------------

        from .balances.loan_accounts import update_loan_account_balances
        update_loan_account_balances(loan_account, timezone.now())

        #---------------

        return entries


def book_overpayment(loan_transaction, amount):
    logger.info(f"Loan account {loan_transaction.loan_account} has been overpaid by the amount {amount}")

    with db_transaction.atomic():
        debit_account = LoanLedgerAccount.objects\
            .get(account_type=LoanLedgerAccountType.LOAN_FUND_SOURCE)
        credit_account = LoanLedgerAccount.objects\
            .get(account_type=LoanLedgerAccountType.LOAN_LIABILITIES)

        return make_double_ledger_entry(
            loan_transaction, 
            amount, 
            debit_account=debit_account, 
            credit_account=credit_account)