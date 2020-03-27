from collections import namedtuple

LoanAccount = namedtuple('LoanAccount', (
    'account_id',
    'loan_limit',
    'current_balance',
    'date_disbursed',
    'principal_due',
    'interest_accrued',
    'fees_accrued',
    'penalties_accrued',
    'status',
    'is_active'))

LoanTransaction = namedtuple('LoanTransaction', (
    'transaction_id',
    'loan_account_id',
    'entry_type',
    'mpesa_transaction_id',
    'amount'))

LoanProfile = namedtuple('LoanProfile', (
    'profile_id',
    'user_account',
    'identity',
    'loan_limit',
    'loan_accounts'
))