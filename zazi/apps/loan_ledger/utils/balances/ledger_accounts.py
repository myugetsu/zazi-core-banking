from decimal import Decimal as D

from django.db import models, transaction as db_transaction
from dateutil.relativedelta import relativedelta

from zazi.core import time as core_time

from ...models import \
    LoanTransactionEntry, LoanLedgerBalance, \
    LoanLedgerAccount, EntryType, LoanLedgerAccountType

from .. import accruals


#--------------

import logging
logger = logging.getLogger(__name__)

#--------------


def summarize_ledger_account_balance(account_type, current_ledger_balance, debit_balance_accrued=None, credit_balance_accrued=None):
    logger.debug("summarize_ledger_account_balance")
    
    balance_field = f"{account_type.get_field_text()}_balance"
    balance_field_bf = f"{balance_field}_bf"

    debit_balance_field = f"{account_type.get_field_text()}_debit_balance"
    debit_balance_field_bf = f"{debit_balance_field}_bf"

    credit_balance_field = f"{account_type.get_field_text()}_credit_balance"
    credit_balance_field_bf = f"{credit_balance_field}_bf"

    logger.debug(f"{balance_field} : {balance_field_bf}")    
    
    if current_ledger_balance.previous_balance_id:
        previous_balance = current_ledger_balance.previous_balance

        if (
            hasattr(previous_balance, debit_balance_field_bf) and 
            hasattr(previous_balance, credit_balance_field_bf) and
            hasattr(previous_balance, debit_balance_field) and 
            hasattr(previous_balance, credit_balance_field)
        ):
            debit_balance = getattr(previous_balance, debit_balance_field)
            debit_balance_bf = getattr(previous_balance, debit_balance_field_bf)

            credit_balance = getattr(previous_balance, credit_balance_field)
            credit_balance_bf = getattr(previous_balance, credit_balance_field_bf)

            setattr(current_ledger_balance, debit_balance_field_bf, (debit_balance + debit_balance_bf))
            setattr(current_ledger_balance, credit_balance_field_bf, (credit_balance + credit_balance_bf))
        elif (
            hasattr(previous_balance, balance_field) and 
            hasattr(previous_balance, balance_field_bf)
        ):
            balance = getattr(previous_balance, balance_field)
            balance_bf = getattr(previous_balance, balance_field_bf)

            setattr(current_ledger_balance, balance_field_bf, (balance + balance_bf))
    
    if (
        hasattr(current_ledger_balance, debit_balance_field) and 
        hasattr(current_ledger_balance, credit_balance_field)
    ):
        setattr(current_ledger_balance, debit_balance_field,  debit_balance_accrued)
        setattr(current_ledger_balance, credit_balance_field,  credit_balance_accrued)
    elif (
        hasattr(current_ledger_balance, balance_field)
    ):
        setattr(current_ledger_balance, balance_field,  (debit_balance_accrued + credit_balance_accrued))


def close_loan_ledger_accounts(time_now):
    logger.debug("close_loan_ledger_accounts()")

    #----------------

    period_end = time_now

    try:
        previous_balance = LoanLedgerBalance.objects.latest('balance_as_at')
        period_start = previous_balance.balance_as_at
        previous_balance.is_current = False
        previous_balance.save()
    except LoanLedgerBalance.DoesNotExist:    
        previous_balance = None
        period_start = None

    # -----------------------

    loan_transaction_entries = LoanTransactionEntry.objects.all()
    
    if period_start:
        loan_transaction_entries = loan_transaction_entries.filter(entry_date__gte=period_start) 
    
    if period_end:
        loan_transaction_entries = loan_transaction_entries.filter(entry_date__lt=period_end)

    # -----------------------

    current_ledger_balance = LoanLedgerBalance.objects\
        .create(previous_balance=previous_balance, balance_as_at=time_now)

    logger.debug("-" * 150)
    logger.debug(f"loan_transaction_entries={loan_transaction_entries}")
    logger.debug("-" * 150)

    loan_transaction_entries = loan_transaction_entries\
        .values('ledger_account__account_type', 'entry_type')\
        .annotate(balance_accrued=models.Sum('amount'))\
        .values_list('ledger_account__account_type', 'entry_type', 'balance_accrued', named=True)

    ledger_entries = list(loan_transaction_entries)
    
    #Close balances for accounts in the entries
    for loan_ledger_account_type in list(LoanLedgerAccountType):
        included_in_entries = False

        debit_entry = credit_entry = None

        for entry in ledger_entries:
            logger.debug(f'entry={entry}')

            if loan_ledger_account_type == entry.ledger_account__account_type:
                included_in_entries = True

                if entry.entry_type == EntryType.CREDIT:
                    credit_entry = entry
                elif entry.entry_type == EntryType.DEBIT:
                    debit_entry = entry

        summarize_ledger_account_balance(
            loan_ledger_account_type, 
            current_ledger_balance, 
            credit_balance_accrued=(credit_entry and credit_entry.balance_accrued or D('0.0')),
            debit_balance_accrued=(debit_entry and debit_entry.balance_accrued or D('0.0')))

        if not included_in_entries:
            summarize_ledger_account_balance(
                loan_ledger_account_type, 
                current_ledger_balance, 
                credit_balance_accrued=D('0.0'),
                debit_balance_accrued=D('0.0'))

    logger.debug("current_ledger_balance.save()")
    current_ledger_balance.is_current = True
    current_ledger_balance.save()

    return current_ledger_balance

