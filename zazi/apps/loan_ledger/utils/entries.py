from collections import namedtuple

from django.db import transaction as db_transaction, models

from zazi.apps.users.enums import UserType
from zazi.apps.loan.enums import (
    LoanTransactionType,
    LoanTransactionStatus)

from zazi.apps.general_ledger.enums import EntryType
from zazi.core.time import timezone

from ..enums import LoanLedgerAccountType, LoanLedgerAccountCategory
from ..models import LoanTransactionEntry, LoanLedgerAccount

#--------------

import logging
logger = logging.getLogger(__name__)

#--------------

Entry = namedtuple('Entry', 'ledger_account, amount, entry_type, entry_date')

def get_ledger_balance_increment(ledger_account, amount, item_type):
    if (amount is None):
        raise Exception("Invalid amount")

    amount = abs(amount)

    if ledger_account.account_category in (
        LoanLedgerAccountCategory.ASSET, 
        LoanLedgerAccountCategory.EXPENSE
    ):
        #Assets and expenses increase with debit
        if (item_type == EntryType.DEBIT):
            amount = +(amount)
        #Yet they decrease with credits
        elif (item_type == EntryType.CREDIT):
            amount = -(amount)

    elif ledger_account.account_category in (
        LoanLedgerAccountCategory.LIABILITY, 
        LoanLedgerAccountCategory.CAPITAL, 
        LoanLedgerAccountCategory.REVENUE
    ):
        #Liability, Equity and Income accounts decrease with debits
        if (item_type == EntryType.DEBIT): 
            amount = -(amount)
        #Yet they increase with credits
        elif (item_type == EntryType.CREDIT):
            amount = +(amount)

    else:
        raise Exception("Invalid account category")

    if ledger_account.is_contra:
        #Reverse whatever categorization that happened up there

        #for normal accounts, return abs amount as it is by this point
        #else, negate the balance, so that we can get its opposite effect

        amount = +(abs(amount)) if amount < 0 else -(abs(amount))

    # return the amount as decided
    return amount


def get_ledger_accounts(loan_transaction_type):
    if loan_transaction_type == LoanTransactionType.LOAN_DISBURSAL:
        debit_account = LoanLedgerAccount.objects\
            .get(account_type=LoanLedgerAccountType.LOAN_PORTFOLIO)
        credit_account = LoanLedgerAccount.objects\
            .get(account_type=LoanLedgerAccountType.LOAN_FUND_SOURCE)

    elif loan_transaction_type == LoanTransactionType.INTEREST_ACCRUAL:
        debit_account = LoanLedgerAccount.objects\
            .get(account_type=LoanLedgerAccountType.INTEREST_RECEIVABLE)
        credit_account = LoanLedgerAccount.objects\
            .get(account_type=LoanLedgerAccountType.INTEREST_REVENUE)

    elif loan_transaction_type == LoanTransactionType.LOAN_LIABILITY:
        debit_account = LoanLedgerAccount.objects\
            .get(account_type=LoanLedgerAccountType.LOAN_FUND_SOURCE)
        credit_account = LoanLedgerAccount.objects\
            .get(account_type=LoanLedgerAccountType.LOAN_LIABILITIES)
    else:
        logger.debug("Unexpectedly here...")

    return (debit_account, credit_account)


def make_double_ledger_entry(loan_transaction, amount, debit_account=None, credit_account=None, entry_date=None):
    logger.debug(f"make_double_ledger_entry({loan_transaction.transaction_id}, {debit_account}, {credit_account}, {amount})")

    with db_transaction.atomic():
        if not (debit_account and credit_account):
            (debit_account, credit_account) = \
                get_ledger_accounts(loan_transaction.transaction_type)

        entries = LoanTransactionEntry.objects.bulk_create([
            LoanTransactionEntry(
                ledger_account=debit_account,
                loan_transaction=loan_transaction,
                entry_type=EntryType.DEBIT,
                amount=get_ledger_balance_increment(debit_account, amount, EntryType.DEBIT),
                entry_date=(entry_date or timezone.localtime())
            ),
            LoanTransactionEntry(
                ledger_account=credit_account,
                loan_transaction=loan_transaction,
                entry_type=EntryType.CREDIT,
                amount=get_ledger_balance_increment(credit_account, amount, EntryType.CREDIT),
                entry_date=(entry_date or timezone.localtime())
            )])

        logger.debug(f"entries = {entries}")
        return entries


def make_single_ledger_entry(loan_transaction, entry):
    logger.debug(f"make_single_ledger_entry({loan_transaction.transaction_id}, {entry})")

    with db_transaction.atomic():
        entries = LoanTransactionEntry.objects.create(
            ledger_account=entry.ledger_account,
            loan_transaction=loan_transaction,
            entry_type=entry.entry_type,
            amount=get_ledger_balance_increment(entry.ledger_account, entry.amount, entry.entry_type),
            entry_date=(entry.entry_date or timezone.localtime())
        )

        logger.debug(f"entries = {entries}")
        return entries


def make_bulk_ledger_entry(loan_transaction, entries, entry_date=None):
    logger.debug(f"make_bulk_ledger_entry({loan_transaction.transaction_id}, {entries})")

    with db_transaction.atomic():
        summaries = []
        sum_of_entries = lambda entries: abs(sum(i.amount for i in entries)) if entries else 0

        for ledger_account_type in list(LoanLedgerAccountType):
            ledger_entries = list(filter(lambda entry: (entry.ledger_account.account_type == ledger_account_type), entries))

            if not ledger_entries:
                continue
            
            debits = []
            credits = []
            ledger_account = None

            for entry in ledger_entries:
                if ledger_account is None:
                    ledger_account = entry.ledger_account

                if entry.entry_type == entry.entry_type == EntryType.DEBIT:
                    debits.append(entry)
                elif entry.entry_type == entry.entry_type == EntryType.CREDIT:
                    credits.append(entry)
            
            summary_amount = sum_of_entries(debits) - sum_of_entries(credits)

            if summary_amount != 0:
                summaries.append(
                    Entry(
                        ledger_account, 
                        summary_amount, 
                        EntryType.CREDIT if summary_amount < 0 else EntryType.DEBIT, 
                        None))

        _entries = LoanTransactionEntry.objects.bulk_create([
            LoanTransactionEntry(
                ledger_account=entry.ledger_account,
                loan_transaction=loan_transaction,
                entry_type=entry.entry_type,
                amount=get_ledger_balance_increment(entry.ledger_account, entry.amount, entry.entry_type),
                entry_date=(entry_date or entry.entry_date or timezone.now())
            )
            for entry in summaries
        ])

        logger.debug(f"entries = {_entries}")
        return _entries
