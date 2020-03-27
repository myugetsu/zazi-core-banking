from collections import namedtuple, defaultdict, OrderedDict

from decimal import Decimal as D
from dateutil.relativedelta import relativedelta

from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from django.db import models, transaction as db_transaction
from django.utils import timezone

from zazi.core import time as core_time

from zazi.apps.loan.models import \
    LoanStatus, LoanTransaction, LoanAccount, LoanProfile, LoanProfileStatus
from zazi.apps.general_ledger.models import \
    GLAccount, GLPeriodClosure, GLTransactionEntry
from zazi.apps.banking.models import BankAccount
from zazi.apps.identity.models import Identity

from ..models import \
    LoanTransactionEntry, LoanLedgerAccountingLink, OwnersCapitalEntry, \
    LoanLedgerBalance, LoanFundSource, LoanFundSourceEntry,\
    LoanLedgerAccount, EntryType, LoanLedgerAccountType

from . import accruals, entries, balances, financial_statements


#--------------

import logging
logger = logging.getLogger(__name__)

#--------------

def loan_profile_data(loan_profile):
    balances = defaultdict(lambda: 0)

    for l in loan_profile.loan_accounts.filter(status=LoanStatus.ACTIVE):
        balances['balance_as_at'] = l.last_balance_update_date
        
        current_balance = l.current_balance

        balances['outstanding_principal_balance'] += (current_balance and current_balance.principal_balance or D('0.0'))
        balances['outstanding_interest_balance'] += (current_balance and current_balance.interest_balance or D('0.0'))
        balances['outstanding_fees_balance'] += (current_balance and current_balance.fees_balance or D('0.0'))
        balances['outstanding_loan_balance'] += (current_balance and current_balance.outstanding_balance or D('0.0'))

    try:
        if loan_profile.user_account_id:
            identity = Identity.objects.get(user_account_id=loan_profile.user_account_id).as_dict()
        else:
            identity = None
    except ObjectDoesNotExist as e:
        logger.debug("Identity not found, creating one")
        identity = Identity.objects\
            .create(user_account_id=loan_profile.user_account_id)\
            .as_dict()
    except MultipleObjectsReturned as e:
        logger.debug("Multiple identies found.")

        identity = Identity.objects\
            .filter(user_account_id=loan_profile.user_account_id)\
            .first()\
            .as_dict()

    data = OrderedDict(
        profile_id=loan_profile.profile_id,
        loan_limit=loan_profile.loan_limit,
        outstanding_balances=balances,
        user_account=loan_profile.user_account.user.username if loan_profile.user_account_id else None,
        identity=identity,
        status=LoanProfileStatus(loan_profile.status or LoanProfileStatus.CLEAN).get_text())

    return data


def get_loan_dashboard_data():
    with db_transaction.atomic():
        current_ledger_balance = LoanLedgerBalance.objects.latest('balance_as_at')
        loan_profiles = LoanProfile.objects\
            .filter(
                status__in=[
                    LoanProfileStatus.CLEAN,
                    LoanProfileStatus.PERFORMING,
                    LoanProfileStatus.DELINQUENT,
                    LoanProfileStatus.DEFAULT])\
            .order_by('user_account__user__date_joined')

        bank_accounts = BankAccount.objects\
            .all()\
            .order_by('name')


        return dict(
            success=True,
            data=dict(
                bank_accounts=[b.as_dict() for b in bank_accounts],
                balance_sheet=financial_statements.get_balance_sheet(current_ledger_balance),
                income_statement=financial_statements.get_income_statement(current_ledger_balance),
                balance_as_at=current_ledger_balance.balance_as_at,
                loan_profiles=[loan_profile_data(l) for l in loan_profiles]))


def fund_loan_book(amount=D('0.0'), transaction_fee=D('0.0'), notes=None, entry_date=None):
    entry_date = (entry_date or timezone.localtime())

    with db_transaction.atomic():
        capital_ledger_account = LoanLedgerAccount.objects\
            .get(account_type=LoanLedgerAccountType.OWNERS_EQUITY)

        owners_capital_entry_amount = entries.get_ledger_balance_increment(
            capital_ledger_account, 
            amount, 
            EntryType.CREDIT)
        OwnersCapitalEntry.objects.create(
            loan_ledger_account=capital_ledger_account,
            amount=owners_capital_entry_amount,
            notes=notes,
            entry_type=EntryType.CREDIT,
            entry_date=entry_date)

        #-------------------

        try:
            previous_balance = balances.ledger_accounts.close_loan_ledger_accounts(entry_date)
            return LoanLedgerBalance.objects\
                .create(
                    previous_balance=previous_balance, 
                    loan_fund_source_balance_bf=(previous_balance.loan_fund_source_balance_bf + previous_balance.loan_fund_source_balance),
                    loan_portfolio_credit_balance_bf=(previous_balance.loan_portfolio_credit_balance_bf + previous_balance.loan_portfolio_credit_balance),
                    loan_portfolio_debit_balance_bf=(previous_balance.loan_portfolio_debit_balance_bf + previous_balance.loan_portfolio_debit_balance),
                    interest_receivable_debit_balance_bf=(previous_balance.interest_receivable_debit_balance_bf + previous_balance.interest_receivable_debit_balance),
                    interest_receivable_credit_balance_bf=(previous_balance.interest_receivable_credit_balance_bf + previous_balance.interest_receivable_credit_balance),
                    fees_receivable_credit_balance_bf=(previous_balance.fees_receivable_credit_balance_bf + previous_balance.fees_receivable_credit_balance),
                    fees_receivable_debit_balance_bf=(previous_balance.fees_receivable_debit_balance_bf + previous_balance.fees_receivable_debit_balance),
                    penalties_receivable_credit_balance_bf=(previous_balance.penalties_receivable_balance_bf + previous_balance.penalties_receivable_balance),
                    penalties_receivable_debit_balance_bf=(previous_balance.penalties_receivable_debit_balance_bf + previous_balance.penalties_receivable_debit_balance),
                    loan_liabilities_balance_bf=(previous_balance.loan_liabilities_balance_bf + previous_balance.loan_liabilities_balance),
                    owners_equity_balance_bf=(previous_balance.owners_equity_balance_bf + previous_balance.owners_equity_balance),
                    interest_revenue_balance_bf=(previous_balance.interest_revenue_balance_bf + previous_balance.interest_revenue_balance),
                    penalties_revenue_balance_bf=(previous_balance.penalties_revenue_balance_bf + previous_balance.penalties_revenue_balance),
                    fees_revenue_balance_bf=(previous_balance.fees_revenue_balance_bf + previous_balance.fees_revenue_balance),
                    principal_write_off_expense_balance_bf=(previous_balance.principal_write_off_expense_balance_bf + previous_balance.principal_write_off_expense_balance),
                    interest_write_off_expense_balance_bf=(previous_balance.interest_write_off_expense_balance_bf + previous_balance.interest_write_off_expense_balance),
                    penalties_write_off_expense_balance_bf=(previous_balance.penalties_write_off_expense_balance_bf + previous_balance.penalties_write_off_expense_balance),
                    fees_write_off_expense_balance_bf=(previous_balance.fees_write_off_expense_balance_bf + previous_balance.fees_write_off_expense_balance),
                    owners_equity_balance=owners_capital_entry_amount,
                    balance_as_at=timezone.now())

        except LoanLedgerBalance.DoesNotExist as e:
            logger.exception(e)
            logger.warning("Please complete system setup first.")


        