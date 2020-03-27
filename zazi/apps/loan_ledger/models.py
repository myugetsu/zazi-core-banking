from collections import OrderedDict, namedtuple
from django.db import models
from django.utils import timezone

from datetime import datetime
from decimal import Decimal as D

from zazi.core.base import BaseModel
from zazi.core.utils import generate_id

from zazi.apps.general_ledger.enums import EntryType

from .enums import LoanLedgerAccountType, LoanLedgerAccountCategory


class LoanTransactionEntry(BaseModel):
    entry_id = models.CharField(max_length=25, default=generate_id)
    
    loan_transaction = models.ForeignKey('loan.LoanTransaction', models.SET_NULL, null=True)

    ledger_account = models.ForeignKey('LoanLedgerAccount', models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'))

    entry_type = models.PositiveSmallIntegerField(choices=EntryType.choices())
    entry_date = models.DateTimeField(null=True)

    class Meta:
        db_table = 'loan_transaction_entry'

    def __str__(self):
        return f"{abs(self.amount)} {EntryType(self.entry_type).get_text()} entry to '{self.ledger_account}' @ '{self.entry_date}'"


    
# --------------


class LoanLedgerAccountingLink(BaseModel):
    gl_account = models.ForeignKey('general_ledger.GLAccount', models.CASCADE)
    loan_ledger_account = models.ForeignKey('LoanLedgerAccount', models.CASCADE, related_name='accounting_links')

    is_active = models.BooleanField(default=False)

    class Meta:
        db_table = 'loan_ledger_accounting_link'
        ordering = ['loan_ledger_account__ledger_code']

    def __str__(self):
        return f"Link `GL:{self.gl_account}` to `LL:{self.loan_ledger_account}`"


class LoanLedgerAccount(BaseModel):
    name = models.CharField(max_length=50)
    ledger_code = models.CharField(max_length=50, unique=True)

    account_category = models.PositiveSmallIntegerField(choices=LoanLedgerAccountCategory.choices(), null=True)
    account_type = models.PositiveSmallIntegerField(choices=LoanLedgerAccountType.choices())

    #a contra account is a general ledger account which is intended 
    #to have its balance be the opposite of the normal balance for 
    #that account classification
    is_contra = models.NullBooleanField()

    class Meta:
        db_table = 'loan_ledger_account'
        ordering = ['ledger_code']

    def __str__(self):
        return f"{self.ledger_code}: {self.name}"

    def as_dict(self):
        return OrderedDict(
            name=self.name,
            ledger_code=self.ledger_code,
            account_category=LoanLedgerAccountCategory(self.account_category).get_text(),
            account_type=LoanLedgerAccountType(self.account_type).get_text())


class LoanFundSource(BaseModel):
    fund_source_id = models.CharField(max_length=25, default=generate_id)
    
    loan_ledger_account = models.ForeignKey('LoanLedgerAccount', models.CASCADE, related_name='loan_fund_source')
    bank_account = models.ForeignKey('banking.BankAccount', models.CASCADE, related_name='loan_fund_sources')

    class Meta:
        db_table = 'loan_fund_source'

    def __str__(self):
        return f"{self.loan_ledger_account}"


class LoanFundSourceEntry(BaseModel):
    entry_id = models.CharField(max_length=25, default=generate_id)
    fund_source = models.ForeignKey('LoanFundSource', models.CASCADE)

    amount = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    notes  = models.CharField(max_length=200)

    entry_type = models.PositiveSmallIntegerField(choices=EntryType.choices())
    entry_date = models.DateTimeField(null=True)

    class Meta:
        db_table = 'loan_fund_source_entry'


class OwnersCapitalEntry(BaseModel):
    entry_id = models.CharField(max_length=25, default=generate_id)

    loan_ledger_account = models.ForeignKey('LoanLedgerAccount', models.CASCADE, related_name='owners_equity_entries')

    amount = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    notes  = models.CharField(max_length=200)

    entry_type = models.PositiveSmallIntegerField(choices=EntryType.choices())
    entry_date = models.DateTimeField(null=True)

    class Meta:
        db_table = 'loan_owners_capital_entry'


# --------------


class LoanLedgerBalance(BaseModel):
    entry_id = models.CharField(max_length=25, default=generate_id)

    previous_balance = models.ForeignKey('self', models.SET_NULL, null=True)
    
    loan_fund_source_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    
    loan_portfolio_credit_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    loan_portfolio_debit_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    
    interest_receivable_debit_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    interest_receivable_credit_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    fees_receivable_debit_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    fees_receivable_credit_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    penalties_receivable_debit_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    penalties_receivable_credit_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))

    loan_liabilities_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    owners_equity_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))

    interest_revenue_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    penalties_revenue_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    fees_revenue_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    principal_write_off_expense_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    interest_write_off_expense_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    penalties_write_off_expense_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    fees_write_off_expense_balance_bf = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))

    # -----------------------

    loan_fund_source_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))

    loan_portfolio_credit_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    loan_portfolio_debit_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))

    interest_receivable_debit_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    interest_receivable_credit_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    fees_receivable_debit_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    fees_receivable_credit_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    penalties_receivable_debit_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    penalties_receivable_credit_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    
    loan_liabilities_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    owners_equity_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))

    interest_revenue_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    penalties_revenue_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    fees_revenue_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    principal_write_off_expense_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    interest_write_off_expense_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    penalties_write_off_expense_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))
    fees_write_off_expense_balance = models.DecimalField(decimal_places=2, max_digits=18, default=D('0.0'))

    # -----------------------

    balance_as_at = models.DateTimeField(null=True)
    is_current = models.NullBooleanField(null=True)

    class Meta:
        db_table = 'loan_ledger_balance'
        ordering = ['balance_as_at']

    @property
    def loan_portfolio_balance_bf(self):
        return (self.loan_portfolio_debit_balance_bf + self.loan_portfolio_credit_balance_bf)

    @property
    def loan_portfolio_balance(self):
        return (self.loan_portfolio_debit_balance + self.loan_portfolio_credit_balance)

    @property
    def interest_receivable_balance_bf(self):
        return (self.interest_receivable_debit_balance_bf + self.interest_receivable_credit_balance_bf)

    @property
    def fees_receivable_balance_bf(self):
        return (self.fees_receivable_debit_balance_bf + self.fees_receivable_credit_balance_bf)

    @property
    def penalties_receivable_balance_bf(self):
        return (self.penalties_receivable_debit_balance_bf + self.penalties_receivable_credit_balance_bf)

    @property
    def interest_receivable_balance(self):
        return (self.interest_receivable_debit_balance + self.interest_receivable_credit_balance)

    @property
    def fees_receivable_balance(self):
        return (self.fees_receivable_debit_balance + self.fees_receivable_credit_balance)

    @property
    def penalties_receivable_balance(self):
        return (self.penalties_receivable_debit_balance + self.penalties_receivable_credit_balance)

    def as_dict(self):
        return OrderedDict(
            entry_id=self.entry_id,
            previous_balance=self.previous_balance.entry_id if self.previous_balance_id else None,
            loan_fund_source_balance_bf=self.loan_fund_source_balance_bf,
            loan_portfolio_balance_bf=self.loan_portfolio_balance_bf,
            interest_receivable_balance_bf=(self.interest_receivable_balance_bf),
            fees_receivable_balance_bf=(self.fees_receivable_balance_bf),
            penalties_receivable_balance_bf=(self.penalties_receivable_balance_bf),
            loan_liabilities_balance_bf=self.loan_liabilities_balance_bf,
            interest_revenue_balance_bf=self.interest_revenue_balance_bf,
            penalties_revenue_balance_bf=self.penalties_revenue_balance_bf,
            fees_revenue_balance_bf=self.fees_revenue_balance_bf,
            principal_write_off_expense_balance_bf=self.principal_write_off_expense_balance_bf,
            interest_write_off_expense_balance_bf=self.interest_write_off_expense_balance_bf,
            penalties_write_off_expense_balance_bf=self.penalties_write_off_expense_balance_bf,
            fees_write_off_expense_balance_bf=self.fees_write_off_expense_balance_bf,
            loan_fund_source_balance=self.loan_fund_source_balance,
            loan_liabilities_balance=self.loan_liabilities_balance,
            loan_portfolio_balance=self.loan_portfolio_balance,
            interest_receivable_balance=self.interest_receivable_balance,
            fees_receivable_balance=self.fees_receivable_balance,
            penalties_receivable_balance=self.penalties_receivable_balance,
            interest_revenue_balance=self.interest_revenue_balance,
            penalties_revenue_balance=self.penalties_revenue_balance,
            fees_revenue_balance=self.fees_revenue_balance,
            principal_write_off_expense_balance=self.principal_write_off_expense_balance,
            interest_write_off_expense_balance=self.interest_write_off_expense_balance,
            penalties_write_off_expense_balance=self.penalties_write_off_expense_balance,
            fees_write_off_expense_balance=self.fees_write_off_expense_balance,
            balance_as_at=timezone.localtime(self.balance_as_at))
    
    def __str__(self):
        return f"Loan Ledger Balance as at {timezone.localtime(self.balance_as_at)}"
