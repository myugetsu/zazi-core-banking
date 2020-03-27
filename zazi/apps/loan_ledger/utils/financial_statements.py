from collections import namedtuple

from dateutil.relativedelta import relativedelta
from decimal import Decimal as D

from django.conf import settings
from django.db import transaction as db_transaction, models
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone

from zazi.apps.banking.models import BankAccount

from ..models import \
    LoanTransactionEntry, LoanLedgerAccount, \
    OwnersCapitalEntry
from ..enums import LoanLedgerAccountType

#--------------

import logging
logger = logging.getLogger(__name__)

#--------------


def humanize(amount):
    if amount >= 0:
        return f"{amount:,.2f}"
    return f"({abs(amount):,.2f})"

class LedgerAccount(dict): pass

def get_balance_sheet(loan_ledger_balance):
    bank_balance = sum([b.current_balance for b in BankAccount.objects.all()])

    def get_assets():
        def get_cash_at_bank():
            # TODO: Fix this hack... Think about how the money 
            # moves in and out the loan ledger
            if settings.DEBUG:
                _bank_balance = bank_balance + (
                    loan_ledger_balance.loan_fund_source_balance + 
                    loan_ledger_balance.loan_fund_source_balance_bf)
            else:
                _bank_balance = bank_balance

            return (_bank_balance, LedgerAccount(
                name="Cash at Bank",
                balance=humanize(_bank_balance),
                children=[]))

        def get_interest_earned():
            balance = (
                loan_ledger_balance.interest_receivable_balance +
                loan_ledger_balance.interest_receivable_balance_bf )

            if balance < 0:
                interest_accrued  = 0
                interest_paid = balance
            else:
                interest_accrued  = balance
                interest_paid = 0
            
            return balance, LedgerAccount(
                name='Interest Earned',
                balance=humanize(balance),
                children=[
                    LedgerAccount(
                        name='Interest Accrued',
                        balance=humanize(interest_accrued),
                        children=[
                            LedgerAccount(
                                name='Interest Paid',
                                balance=humanize(interest_paid),
                                children=[])])])

        def get_loan_portfolio():
            balance = (
                loan_ledger_balance.loan_portfolio_balance + 
                loan_ledger_balance.loan_portfolio_balance_bf)

            if balance < 0:
                loan_principal_due  = 0
                loan_principal_paid = balance
            else:
                loan_principal_due  = balance
                loan_principal_paid = 0
            
            return balance, LedgerAccount(
                name='Loan Portfolio',
                balance=humanize(balance),
                children=[
                    LedgerAccount(
                        name='Loan Principal Due',
                        balance=humanize(loan_principal_due),
                        children=[
                            LedgerAccount(
                                name='Loan Principal Paid',
                                balance=humanize(loan_principal_paid),
                                children=[])])])

        # --------

        (cash_at_bank, cash_at_bank_items) = get_cash_at_bank()
        (loan_portfolio, loan_portfolio_items) = get_loan_portfolio()
        (interest_earned, interest_earned_items) = get_interest_earned()

        assets_total = (cash_at_bank + loan_portfolio + interest_earned)
        
        return (
            assets_total, [
                cash_at_bank_items,
                loan_portfolio_items,
                interest_earned_items,
            ])

    def get_equity():
        def get_owners_equity():
            aggregate = OwnersCapitalEntry.objects\
                .all()\
                .values('amount')\
                .aggregate(balance=models.Sum('amount'))
            entry_balance = aggregate.get('balance')

            total_owners_equity = entry_balance
        
            return total_owners_equity, LedgerAccount(
                name="Owner's Equity",
                balance=humanize(total_owners_equity),
                children=[]
            )

        def get_expected_earnings():
            def get_write_off_expense_balance():
                return (
                    loan_ledger_balance.principal_write_off_expense_balance_bf +
                    loan_ledger_balance.principal_write_off_expense_balance +
                    loan_ledger_balance.interest_write_off_expense_balance_bf +
                    loan_ledger_balance.interest_write_off_expense_balance +
                    loan_ledger_balance.penalties_write_off_expense_balance_bf +
                    loan_ledger_balance.penalties_write_off_expense_balance +
                    loan_ledger_balance.fees_write_off_expense_balance_bf +
                    loan_ledger_balance.fees_write_off_expense_balance)

            def get_earned_revenue_balance():
                return (
                    loan_ledger_balance.interest_revenue_balance_bf +
                    loan_ledger_balance.interest_revenue_balance)

            def get_fees_expense():
                return (
                    loan_ledger_balance.fees_revenue_balance_bf +
                    loan_ledger_balance.fees_revenue_balance)
            
            expense = (get_write_off_expense_balance() + get_fees_expense())
            expected_earnings = (get_earned_revenue_balance() - expense)

            return (expected_earnings, LedgerAccount(
                name="Expected Earnings",
                balance=humanize(expected_earnings),
                children=[]))

        #------------------
        
        owners_equity_total, owners_equity_items = get_owners_equity()
        expected_earnings_total, expected_earnings_items = get_expected_earnings()

        return (owners_equity_total + expected_earnings_total), [
            owners_equity_items,
            expected_earnings_items,
            LedgerAccount(
                name="Retained Earnings",
                balance=D('0.00'),
                children=[]
            )
        ]
    
    def get_liabilities():
        liabilities_total = (
            loan_ledger_balance.loan_liabilities_balance_bf + 
            loan_ledger_balance.loan_liabilities_balance
        )
        return liabilities_total, [
            LedgerAccount(
                name='Loan Overpayments',
                balance=humanize(liabilities_total),
                children=[]
            )
        ]
    #--------------------
    assets_total, assets_items = get_assets()
    equity_total, equity_items = get_equity()
    liabilities_total, liability_items = get_liabilities()
    accounting_equation = (assets_total - (liabilities_total + equity_total))
    
    return {
        'assets': assets_items,
        'liabilities': liability_items,
        'equity': equity_items,
        'accounting_equation': humanize(accounting_equation)
    }


def get_income_statement(loan_ledger_balance):
    return {
        'revenue': [
            LedgerAccount(
                name="Interest Revenue",
                balance=humanize(
                    loan_ledger_balance.interest_revenue_balance_bf +
                    loan_ledger_balance.interest_revenue_balance
                ),
                children=[
                ]
            )
        ],
        'expense': {
            'Principal Write-off Expense': humanize(
                loan_ledger_balance.principal_write_off_expense_balance_bf +
                loan_ledger_balance.principal_write_off_expense_balance
            ),
            'Interest Write-off Expense': humanize(
                loan_ledger_balance.interest_write_off_expense_balance_bf +
                loan_ledger_balance.interest_write_off_expense_balance
            ),
            'Fees Write-off Expense': humanize(
                loan_ledger_balance.penalties_write_off_expense_balance_bf +
                loan_ledger_balance.penalties_write_off_expense_balance +
                loan_ledger_balance.fees_write_off_expense_balance_bf +
                loan_ledger_balance.fees_write_off_expense_balance
            ),
            'Mpesa Transaction Expense': humanize(
                loan_ledger_balance.fees_revenue_balance_bf +
                loan_ledger_balance.fees_revenue_balance
            )}}