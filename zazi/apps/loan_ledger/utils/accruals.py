from decimal import Decimal as D
from dateutil.relativedelta import relativedelta

from django.db import transaction as db_transaction, models
from django.utils import timezone

from zazi.apps.loan.enums import (
    LoanStatus,
    LoanInterestMethod,
    LoanTransactionType,
    LoanTransactionStatus,
    LoanInterestRateAccrualSchedule,
    LoanAllocationItem)
from zazi.apps.loan.models import LoanTransaction, LoanAccount, LoanAccountBalance
from zazi.apps.general_ledger.enums import EntryType

from zazi.core import time as core_time, rounding

from ..models import LoanLedgerAccount
from ..enums import LoanLedgerAccountType, LoanLedgerAccountCategory

from .entries import make_double_ledger_entry
from .balances.loan_accounts import update_loan_account_balances

#--------------

import logging
logger = logging.getLogger(__name__)

#--------------

def write_off_all_loans_past_90_days(time=None, active_loan_accounts=None, *args, **kwargs):
    logger.debug(f"write_off_all_loans_past_90_days()")

    # ---------------------

    def write_off_loan(loan_account):
        # get the ledger accounts
        with db_transaction.atomic():
            time_now = timezone.now()

            loan_transaction = LoanTransaction.objects.create(
                transaction_type=LoanTransactionType.WRITE_OFF,
                loan_account=loan_account,
                amount=loan_account.outstanding_balance,
                initiated_at=time_now,
                posted_at=time_now,
                status=LoanTransactionStatus.POSTED_TO_LOANS_LEDGER)
            
            #-------
            for (item, amount) in loan_account.get_repayment_items().items():
                if amount <= 0:
                    continue

                if item == LoanAllocationItem.PRINCIPAL:
                    debit_account = LoanLedgerAccount.objects\
                        .get(account_type=LoanLedgerAccountType.PRINCIPAL_WRITE_OFF_EXPENSE)
                    credit_account = LoanLedgerAccount.objects\
                        .get(account_type=LoanLedgerAccountType.LOAN_PORTFOLIO)
                elif item == LoanAllocationItem.INTEREST:
                    debit_account = LoanLedgerAccount.objects\
                        .get(account_type=LoanLedgerAccountType.INTEREST_WRITE_OFF_EXPENSE)
                    credit_account = LoanLedgerAccount.objects\
                        .get(account_type=LoanLedgerAccountType.INTEREST_RECEIVABLE)
                elif item == LoanAllocationItem.PENALTY:
                    debit_account = LoanLedgerAccount.objects\
                        .get(account_type=LoanLedgerAccountType.PENALTIES_WRITE_OFF_EXPENSE)
                    credit_account = LoanLedgerAccount.objects\
                        .get(account_type=LoanLedgerAccountType.PENALTIES_RECEIVABLE)
                elif item == LoanAllocationItem.FEES:
                    debit_account = LoanLedgerAccount.objects\
                        .get(account_type=LoanLedgerAccountType.FEES_WRITE_OFF_EXPENSE)
                    credit_account = LoanLedgerAccount.objects\
                        .get(account_type=LoanLedgerAccountType.TRANSACTION_FEES_EXPENSE)
                else:
                    continue    

                make_double_ledger_entry(
                    loan_transaction, 
                    amount, 
                    debit_account=debit_account, 
                    credit_account=credit_account)

            liability_balance = abs(loan_transaction.outstanding_balance.liabilities_balance)
            if liability_balance > 0:
                debit_account = LoanLedgerAccount.objects\
                    .get(account_type=LoanLedgerAccountType.LOAN_LIABILITIES)
                credit_account = LoanLedgerAccount.objects\
                    .get(account_type=LoanLedgerAccountType.LOAN_FUND_SOURCE)

                make_double_ledger_entry(
                    loan_transaction, 
                    amount, 
                    debit_account=debit_account,
                    credit_account=credit_account)
            
            loan_account.status = LoanStatus.WRITTEN_OFF
            loan_account.save()

    # ---------------------

    with db_transaction.atomic():
        time_now = (time or timezone.now())
        day_90 = (time_now - relativedelta(days=90))

        loan_accounts_with_outstanding_balance = \
            (active_loan_accounts or LoanAccount.objects)\
                .filter(
                    status__in=(
                        LoanStatus.ACTIVE,
                        LoanStatus.IN_ARREARS, 
                        LoanStatus.DEFAULTED),
                    date_disbursed__lt=day_90)\
                .annotate(
                    _principal_balance=(models.F('account_balances__principal_due') - models.F('account_balances__principal_paid')),
                    _penalties_balance=(models.F('account_balances__penalties_accrued') - models.F('account_balances__penalties_paid')),
                    _fees_balance=(models.F('account_balances__fees_accrued') - models.F('account_balances__fees_paid')),
                    _liability_balance=(models.F('account_balances__liability_credit_balance') - models.F('account_balances__liability_debit_balance')),
                    _interest_balance=(models.F('account_balances__interest_accrued') - models.F('account_balances__interest_paid')))\
                .annotate(_current_balance=(
                    models.F('_principal_balance') +
                    models.F('_penalties_balance') +
                    models.F('_fees_balance') +
                    models.F('_interest_balance') +
                    models.F('_liability_balance')
                ))\
                .filter(_current_balance__gt=0)

        for loan_account in loan_accounts_with_outstanding_balance:
            logger.log(f"Writing off loan account #{loan_account}")

            write_off_loan(loan_account)
            update_loan_account_balances(loan_account, time_now)


#-----------------


def accrue_all_active_loans(active_loan_accounts=None, time=None, *args, **kwargs):
    logger.debug(f"calling scheduled accrue_all_active_loans({args}, {kwargs}) at {timezone.now()}")

    # ---------------

    def accrue_loan_interest(loan_account, save=False):
        logger.debug(f"accrue_loan_interest({loan_account})")

        def calculate_interest_amount(
            principal, 
            interest_method=LoanInterestMethod.REDUCING_BALANCE, 
            interest_rate=None, 
            interest_rate_accrual_schedule=LoanInterestRateAccrualSchedule.DAILY
        ):
            if not interest_rate:
                interest_rate = D("0.01")

            interest = (principal * interest_rate)
            logger.debug(f"({principal} * {interest_rate})={interest}")

            return interest

        # -------------

        with db_transaction.atomic():
            if not loan_account.product_id:
                logger.info(f"Loan account {loan_account.product_id} has no product attached")
                return

            #get product particulars    
            product = loan_account.product
            
            interest_amount = calculate_interest_amount(
                loan_account.current_balance.principal_balance,
                interest_method=product.interest_method,
                interest_rate=product.interest_rate,
                interest_rate_accrual_schedule=product.interest_rate_accrual_schedule)

            assert (interest_amount > 0), f"Interest rate cannot be {interest_amount}"
            
            # get the ledger accounts
            time_now = timezone.now()
            loan_transaction = LoanTransaction.objects.create(
                transaction_type=LoanTransactionType.INTEREST_ACCRUAL,
                loan_account=loan_account,
                amount=rounding.round_up(interest_amount, decimal_places=2),
                initiated_at=time_now,
                posted_at=time_now,
                status=LoanTransactionStatus.POSTED_TO_LOANS_LEDGER)

            make_double_ledger_entry(loan_transaction, interest_amount, entry_date=time)

        logger.debug(f"finished `accrue_loan_interest({loan_account})`")

    # --------------------
    # Accrue interests for accounts below 90 days only
    
    # Since we accrue 24 times a day, revert to minute 0
    time_now = (time or core_time.top_of_the_hour())

    _90_days_ago = core_time._90_days_ago(time_now)
    _24_hours_ago  = core_time._1_day_ago(time_now)

    logger.debug(f"time_now={time_now}")
    logger.debug(f"_90_days_ago={_90_days_ago}")
    logger.debug(f"_24_hours_ago={_24_hours_ago}")

    with db_transaction.atomic():
        # get all legible active loan accounts 
        loan_accounts_with_principal_balance = (LoanAccountBalance.objects)\
            .filter(
                loan_account__status=LoanStatus.ACTIVE,
                #include only those whose date disbursed in between 1 and 90 days ago
                loan_account__date_disbursed__gt=_90_days_ago, 
                loan_account__date_disbursed__lte=_24_hours_ago,
                is_current=True
            )\
            .filter(
                #include those not yet ever accrued
                models.Q(loan_account__last_interest_accrual_date__isnull=True) | 
                #include only those accrued more than 24 hours ago
                models.Q(loan_account__last_interest_accrual_date__lte=_24_hours_ago))\
            .annotate(
                _principal_balance=(
                    (
                        models.F('principal_due_bf') +
                        models.F('principal_due')
                    ) - (
                        models.F('principal_paid_bf') +
                        models.F('principal_paid')
                    )
                )
            )\
            .filter(_principal_balance__gt=0)\
            .distinct()
    
        for loan_account_balance in loan_accounts_with_principal_balance:
            loan_account = loan_account_balance.loan_account

            logger.debug(f"accruing active loan account: {loan_account}")

            accrue_loan_interest(loan_account)
            update_loan_account_balances(loan_account, time_now, save=False)
            
            loan_account.last_interest_accrual_date = time_now
            loan_account.save()

    # --------------------

    logger.debug(f"finished scheduled accrue_all_active_loans({args}, {kwargs}) at {timezone.now()}")
