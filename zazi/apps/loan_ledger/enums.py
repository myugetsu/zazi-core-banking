from collections import OrderedDict

from zazi.core.enums import IntEnumChoices
from zazi.apps.loan.enums import LoanAllocationItem


class LoanLedgerAccountCategory(IntEnumChoices):
    ASSET = 1
    LIABILITY = 2
    CAPITAL = 3
    REVENUE = 4
    EXPENSE = 5

    def get_text(self):
        return {
            LoanLedgerAccountCategory.ASSET: "ASSET",
            LoanLedgerAccountCategory.LIABILITY: "LIABILITY",
            LoanLedgerAccountCategory.CAPITAL: "CAPITAL",
            LoanLedgerAccountCategory.REVENUE: "REVENUE",
            LoanLedgerAccountCategory.EXPENSE: "EXPENSE",
        }[self]


class LoanLedgerAccountType(IntEnumChoices):
    # balance sheet accounts
    # assets
    LOAN_FUND_SOURCE = 1
    LOAN_PORTFOLIO = 2

    LOAN_LIABILITIES = 3

    INTEREST_RECEIVABLE = 4
    FEES_RECEIVABLE = 5
    PENALTIES_RECEIVABLE = 6

    # income statement accounts
    INTEREST_REVENUE = 7
    PENALTIES_REVENUE = 8
    FEES_REVENUE = 9

    PRINCIPAL_WRITE_OFF_EXPENSE = 10
    INTEREST_WRITE_OFF_EXPENSE = 11
    PENALTIES_WRITE_OFF_EXPENSE = 12
    FEES_WRITE_OFF_EXPENSE = 13

    TRANSACTION_FEES_EXPENSE = 14

    OWNERS_EQUITY = 15

    def get_text(self):
        return {
            LoanLedgerAccountType.LOAN_FUND_SOURCE: "loan_fund_source",
            LoanLedgerAccountType.LOAN_PORTFOLIO: "loan_portfolio",
            LoanLedgerAccountType.LOAN_LIABILITIES: "loan_liabilities",
            LoanLedgerAccountType.OWNERS_EQUITY: "owners_equity",
            LoanLedgerAccountType.INTEREST_RECEIVABLE: "interest_receivable",
            LoanLedgerAccountType.FEES_RECEIVABLE: "fees_receivable",
            LoanLedgerAccountType.PENALTIES_RECEIVABLE: "penalties_receivable",
            LoanLedgerAccountType.INTEREST_REVENUE: "interest_revenue",
            LoanLedgerAccountType.PENALTIES_REVENUE: "penalties_revenue",
            LoanLedgerAccountType.FEES_REVENUE: "fees_revenue",
            LoanLedgerAccountType.TRANSACTION_FEES_EXPENSE: "transaction_fees_expense",
            LoanLedgerAccountType.PRINCIPAL_WRITE_OFF_EXPENSE: "principal_write_off_expense",
            LoanLedgerAccountType.INTEREST_WRITE_OFF_EXPENSE: "interest_write_off_expense",
            LoanLedgerAccountType.PENALTIES_WRITE_OFF_EXPENSE: "penalties_write_off_expense",
            LoanLedgerAccountType.FEES_WRITE_OFF_EXPENSE: "fees_write_off_expense",
        }[self]

    def get_field_text(self):
        return {
            LoanLedgerAccountType.LOAN_FUND_SOURCE: "loan_fund_source",
            LoanLedgerAccountType.LOAN_PORTFOLIO: "loan_portfolio",
            LoanLedgerAccountType.LOAN_LIABILITIES: "loan_liabilities",
            LoanLedgerAccountType.OWNERS_EQUITY: "owners_equity",
            LoanLedgerAccountType.INTEREST_RECEIVABLE: "interest_receivable",
            LoanLedgerAccountType.FEES_RECEIVABLE: "fees_receivable",
            LoanLedgerAccountType.PENALTIES_RECEIVABLE: "penalties_receivable",
            LoanLedgerAccountType.INTEREST_REVENUE: "interest_revenue",
            LoanLedgerAccountType.PENALTIES_REVENUE: "penalties_revenue",
            LoanLedgerAccountType.FEES_REVENUE: "fees_revenue",
            LoanLedgerAccountType.TRANSACTION_FEES_EXPENSE: "fees_revenue",
            LoanLedgerAccountType.PRINCIPAL_WRITE_OFF_EXPENSE: "principal_write_off_expense",
            LoanLedgerAccountType.INTEREST_WRITE_OFF_EXPENSE: "interest_write_off_expense",
            LoanLedgerAccountType.PENALTIES_WRITE_OFF_EXPENSE: "penalties_write_off_expense",
            LoanLedgerAccountType.FEES_WRITE_OFF_EXPENSE: "fees_write_off_expense",
        }[self]
