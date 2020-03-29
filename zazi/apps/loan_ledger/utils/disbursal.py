from collections import namedtuple

from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from django.db import transaction as db_transaction, models
from django.utils import timezone

from zazi.apps.general_ledger.enums import EntryType
from zazi.apps.loan.enums import (
    LoanTransactionType,
    LoanTransactionStatus,
    LoanAllocationItem)
from zazi.apps.users.enums import UserType


from ..models import LoanLedgerAccount
from ..enums import LoanLedgerAccountType

from .entries import make_bulk_ledger_entry, Entry

#--------------

import logging
logger = logging.getLogger(__name__)

#--------------


def book_disbursal(loan_transaction, disbursed_amount=None, disbursal_fee=None, save=False):
    logger.debug(f"book_disbursal({loan_transaction}, {disbursed_amount}, {disbursal_fee})")

    with db_transaction.atomic():
        assert (loan_transaction.transaction_type == LoanTransactionType.LOAN_DISBURSAL), (
            "Not a loan disbursal transaction")
        assert (loan_transaction.status == LoanTransactionStatus.PROCESSED), (
            "Loan transaction not processed yet")

        entries = []
        outstanding_balance = loan_transaction\
            .loan_account\
            .loan_profile\
            .outstanding_balance

        assert not (outstanding_balance > 0), "Attempting to disburse to an account with an outstanding balance"

        if outstanding_balance < 0:
            credit_account = LoanLedgerAccount.objects\
                .get(account_type=LoanLedgerAccountType.LOAN_PORTFOLIO)
            debit_account = LoanLedgerAccount.objects\
                .get(account_type=LoanLedgerAccountType.LOAN_LIABILITIES)

            entries += [
                Entry(
                    ledger_account=credit_account, 
                    amount=abs(outstanding_balance), 
                    entry_type=EntryType.CREDIT, 
                    entry_date=None),
                Entry(
                    ledger_account=debit_account,
                    amount=abs(outstanding_balance),
                    entry_type=EntryType.DEBIT,
                    entry_date=None
                )]

        credit_account = LoanLedgerAccount.objects\
            .get(account_type=LoanLedgerAccountType.LOAN_FUND_SOURCE)
        debit_account = LoanLedgerAccount.objects\
            .get(account_type=LoanLedgerAccountType.LOAN_PORTFOLIO)

        entries += [
            Entry(
                ledger_account=credit_account, 
                amount=disbursed_amount, 
                entry_type=EntryType.CREDIT, 
                entry_date=None),
            Entry(
                ledger_account=debit_account,
                amount=disbursed_amount,
                entry_type=EntryType.DEBIT,
                entry_date=None
            )]

        if ((disbursal_fee or 0) > 0):
            debit_account = LoanLedgerAccount.objects\
                .get(account_type=LoanLedgerAccountType.TRANSACTION_FEES_EXPENSE)
            
            entries += [
                Entry(
                    ledger_account=credit_account, 
                    amount=disbursal_fee, 
                    entry_type=EntryType.CREDIT, 
                    entry_date=None),
                Entry(
                    ledger_account=debit_account,
                    amount=disbursal_fee,
                    entry_type=EntryType.DEBIT,
                    entry_date=None
                )]

        make_bulk_ledger_entry(
            loan_transaction,
            entries)

        loan_account = loan_transaction.loan_account
        loan_transaction.status = LoanTransactionStatus.POSTED_TO_LOANS_LEDGER
        
        #---------------

        from .balances.loan_accounts import update_loan_account_balances
        update_loan_account_balances(loan_account, timezone.now())

        loan_account.refresh_from_db()

        if save:
            loan_transaction.save()