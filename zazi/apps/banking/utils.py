import logging

from .models import BankAccount, BankAccountType

from django.db import transaction as db_transaction
from django.utils import timezone

from zazi.apps.mpesa.enums import AccountType
from zazi.apps.mpesa.utils.balance import request_check_balance

from zazi.apps.loan_ledger.utils.balances.ledger_accounts import close_loan_ledger_accounts

# ------------

logger = logging.getLogger(__name__)

# -------------


def check_bank_account_balances():
    logger.debug("check_bank_account_balances()")

    bank_accounts = BankAccount.objects.all()
    logger.debug(f"Bank accounts {bank_accounts}")

    for bank_account in bank_accounts:
        if bank_account.bank_account_type == BankAccountType.MOBILE_MONEY_ACCOUNT:
            logger.debug(f"Checking mobile money account {bank_account}.")

            #TODO: Work to have permissions for B2C check balance
            linked_mpesa_accounts = bank_account.linked_mpesa_accounts.filter(
                mpesa_account__account_type=AccountType.C2B_PAYBILL_ACCOUNT)

            logger.debug(f"Number of linked Mpesa accounts: {linked_mpesa_accounts.count()}")

            for mpesa_bank_account in linked_mpesa_accounts:
                mpesa_account = mpesa_bank_account.mpesa_account
                logger.debug(f"checking balance for mpesa account {mpesa_account}.")

                request_check_balance(mpesa_account=mpesa_account)
        else:
            logger.debug(f"Checking bank account {bank_account}.")
            pass


def update_balance_sheet():
    with db_transaction.atomic():
        check_bank_account_balances()
        close_loan_ledger_accounts(timezone.now())
