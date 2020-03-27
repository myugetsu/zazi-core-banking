from decimal import Decimal as D

from django.db import models, transaction as db_transaction
from dateutil.relativedelta import relativedelta

from zazi.core import time as core_time

from zazi.apps.loan.models import \
    LoanTransaction, LoanAccount, LoanStatus, LoanAccountBalance

from ...models import \
    LoanTransactionEntry, LoanLedgerBalance, \
    LoanLedgerAccount, EntryType, LoanLedgerAccountType

from .. import accruals


#--------------

import logging
logger = logging.getLogger(__name__)

#--------------

BALANCE_ACCOUNTS = [
    LoanLedgerAccountType.TRANSACTION_FEES_EXPENSE,
    LoanLedgerAccountType.INTEREST_RECEIVABLE,
    LoanLedgerAccountType.PENALTIES_RECEIVABLE,
    LoanLedgerAccountType.FEES_RECEIVABLE,
    LoanLedgerAccountType.LOAN_PORTFOLIO,
    LoanLedgerAccountType.LOAN_LIABILITIES ]


def carry_forward_loan_account_balance(loan_account, previous_balance, time, save=False):
    logger.debug(f"carry_forward_balance({loan_account}, {time})")

    current_balance = LoanAccountBalance(
        loan_account=loan_account,
        previous_balance=previous_balance,
        balance_as_at=time)
    
    if previous_balance is not None:
        logger.debug("A previous balance exists")

        current_balance.principal_paid_bf = (previous_balance.principal_paid_bf + previous_balance.principal_paid)
        current_balance.interest_paid_bf = (previous_balance.interest_paid_bf + previous_balance.interest_paid)
        current_balance.fees_paid_bf = (previous_balance.fees_paid_bf + previous_balance.fees_paid)
        current_balance.fees_accrued_bf = (previous_balance.fees_accrued_bf + previous_balance.fees_accrued)
        current_balance.penalties_paid_bf = (previous_balance.penalties_paid_bf + previous_balance.penalties_paid)
        current_balance.penalties_accrued_bf = (previous_balance.penalties_accrued_bf + previous_balance.penalties_accrued)
        current_balance.principal_due_bf = (previous_balance.principal_due_bf + previous_balance.principal_due)
        current_balance.interest_accrued_bf = (previous_balance.interest_accrued_bf + previous_balance.interest_accrued)

        current_balance.liability_debit_balance_bf = (
            previous_balance.liability_debit_balance_bf + previous_balance.liability_debit_balance)
        current_balance.liability_credit_balance_bf = (
            previous_balance.liability_credit_balance_bf + previous_balance.liability_credit_balance)

    current_balance.is_current = True

    if save:
        current_balance.save()

    return current_balance


def summarize_loan_account_balances(current_balance, entry, save=False):
    logger.debug(f'summarize_loan_account_balances({current_balance}, {entry})')
    
    # -------------------
    # Reconcile the loan accounts and the loans ledger balances

    if entry.get('ledger_account__account_type') == LoanLedgerAccountType.INTEREST_RECEIVABLE:
        if entry.get('entry_type') == EntryType.CREDIT:
            current_balance.interest_paid = abs(entry.get('balance_accrued') or 0)
        elif entry.get('entry_type') == EntryType.DEBIT:
            current_balance.interest_accrued = abs(entry.get('balance_accrued') or 0)

    elif entry.get('ledger_account__account_type') == LoanLedgerAccountType.PENALTIES_RECEIVABLE:
        if entry.get('entry_type') == EntryType.CREDIT:
            current_balance.penalties_paid = abs(entry.get('balance_accrued') or 0)
        elif entry.get('entry_type') == EntryType.DEBIT:
            current_balance.penalties_accrued = abs(entry.get('balance_accrued') or 0)

    elif entry.get('ledger_account__account_type') == LoanLedgerAccountType.FEES_RECEIVABLE:  
        if entry.get('entry_type') == EntryType.CREDIT:
            current_balance.fees_paid = abs(entry.get('balance_accrued') or 0)
        elif entry.get('entry_type') == EntryType.DEBIT:
            current_balance.fees_accrued = abs(entry.get('balance_accrued') or 0)
    
    elif entry.get('ledger_account__account_type') == LoanLedgerAccountType.TRANSACTION_FEES_EXPENSE:
        if entry.get('entry_type') == EntryType.CREDIT:
            current_balance.fees_paid = abs(entry.get('balance_accrued') or 0)
        elif entry.get('entry_type') == EntryType.DEBIT:
            current_balance.fees_accrued = abs(entry.get('balance_accrued') or 0)

    elif entry.get('ledger_account__account_type') == LoanLedgerAccountType.LOAN_PORTFOLIO:
        if entry.get('entry_type') == EntryType.CREDIT:
            current_balance.principal_paid = abs(entry.get('balance_accrued') or 0)
        elif entry.get('entry_type') == EntryType.DEBIT:
            current_balance.principal_due = abs(entry.get('balance_accrued') or 0)

    elif entry.get('ledger_account__account_type') == LoanLedgerAccountType.LOAN_LIABILITIES:

        if entry.get('entry_type') == EntryType.CREDIT:
            current_balance.liability_credit_balance = (entry.get('balance_accrued') or 0)
        elif entry.get('entry_type') == EntryType.DEBIT:
            current_balance.liability_debit_balance = (entry.get('balance_accrued') or 0)


def update_loan_account_balances(loan_account, time, save=True):
    logger.debug(f'update_loan_account_balances({loan_account}, {time})')
    
    with db_transaction.atomic():
        try:
            previous_balance = LoanAccountBalance.objects\
                .filter(loan_account=loan_account, is_current=True)\
                .latest('balance_as_at')
            LoanAccountBalance.objects\
                .filter(loan_account=loan_account)\
                .update(is_current=False)
            last_balance_as_at = previous_balance.balance_as_at
        except LoanAccountBalance.DoesNotExist:
            previous_balance = None
            last_balance_as_at = None

        entries = get_pending_loan_transaction_entries(loan_account, last_balance_as_at, time)
        
        if entries.count() == 0:
            logger.debug("No pending entries for this account")
        else:
            logger.debug(entries)

        current_balance = carry_forward_loan_account_balance(loan_account, previous_balance, time)

        #-----------------
        
        for entry in entries:
            logger.debug(f"Updating {loan_account} balance with {entry}")
            summarize_loan_account_balances(current_balance, entry)

        #-----------------

        current_balance.save()
        loan_account.last_balance_update_date = time

        if save:
            loan_account.save()


def get_pending_loan_transaction_entries(loan_account, start_time=None, end_time=None):
    logger.debug(f"get_pending_loan_transaction_entries({loan_account}, {start_time}, {end_time})")

    loan_account_entries = LoanTransactionEntry.objects\
        .filter(ledger_account__account_type__in=BALANCE_ACCOUNTS)

    if end_time:
        loan_account_entries = loan_account_entries\
            .filter(entry_date__lte=end_time)

    if start_time:
        loan_account_entries = loan_account_entries\
            .filter(entry_date__gt=start_time)

    pending_entries = loan_account_entries\
        .filter(loan_transaction__loan_account=loan_account)\
        .values('ledger_account__account_type', 'entry_type')\
        .annotate(balance_accrued=models.Sum('amount'))

    return pending_entries


def update_all_active_loan_account_balances(time):
    logger.debug(f"update_all_active_loan_account_balances(@{time})")

    active_loan_accounts = LoanAccount.objects.filter()

    for loan_account in active_loan_accounts:
        update_loan_account_balances(loan_account, time)


def pay_off_loans_with_cleared_balances(time):
    logger.debug(f"pay_off_loans_with_cleared_balances(@{time})")

    active_loan_accounts_without_outstanding_balance = \
        LoanAccount.objects\
            .filter(
                status__in=(
                    LoanStatus.ACTIVE,
                    LoanStatus.IN_ARREARS, 
                    LoanStatus.DEFAULTED
                ),
                account_balances__is_current=True
            )\
            .annotate(
                _principal_balance=(models.F('account_balances__principal_due') - models.F('account_balances__principal_paid')),
                _penalties_balance=(models.F('account_balances__penalties_accrued') - models.F('account_balances__penalties_paid')),
                _liability_balance=(models.F('account_balances__liability_credit_balance') - models.F('account_balances__liability_debit_balance')),
                _fees_balance=(models.F('account_balances__fees_accrued') - models.F('account_balances__fees_paid')),
                _interest_balance=(models.F('account_balances__interest_accrued') - models.F('account_balances__interest_paid')))\
            .annotate(_outstanding_balance=(
                    models.F('_principal_balance') +
                    models.F('_penalties_balance') +
                    models.F('_fees_balance') +
                    models.F('_interest_balance') +
                    models.F('_liability_balance')
                )
            )\
            .filter(_outstanding_balance=0)

    for loan_account in active_loan_accounts_without_outstanding_balance:
        logger.debug("Number of loan accounts")

        loan_account.save()