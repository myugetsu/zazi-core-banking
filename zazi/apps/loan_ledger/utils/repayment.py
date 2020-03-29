from collections import namedtuple

from dateutil.relativedelta import relativedelta
from decimal import Decimal as D

from django.db import transaction as db_transaction, models
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone

from zazi.apps.users.enums import UserType
from zazi.apps.loan.enums import (
    LoanStatus,
    LoanTransactionType,
    LoanTransactionStatus,
    LoanAllocationItem)

from zazi.apps.general_ledger.enums import EntryType

from ..models import LoanTransactionEntry, LoanLedgerAccount
from ..enums import LoanLedgerAccountType

from .liability import book_overpayment
from .entries import \
    make_double_ledger_entry, make_single_ledger_entry, make_bulk_ledger_entry, Entry

#--------------

import logging
logger = logging.getLogger(__name__)

#--------------


def book_repayment(loan_transaction):
    logger.debug(f"book_repayment({loan_transaction})")

    """
    Records a repayment made on the loan account provided
    """
    
    def get_allocation_order(loan_account):
        try:
            return loan_account.product.allocation_order
        except ObjectDoesNotExist:
            return [
                LoanAllocationItem.LIABILITY,
                LoanAllocationItem.FEES,
                LoanAllocationItem.PENALTY,
                LoanAllocationItem.INTEREST,
                LoanAllocationItem.PRINCIPAL ]

    LoanRepaymentAllocation = namedtuple('LoanRepaymentAllocation', 'amount,item')

    def allocate_repayment_amount(loan_transaction, amount):
        """
        Allocate a loan repayment among the various allocation items;
        
        - Penalty
        - Fees
        - Interest
        - Principal
        """
        #----------

        logger.debug(f"allocate_repayment_amount()")

        #----------

        loan_account = loan_transaction.loan_account

        allocation_order = get_allocation_order(loan_account)
        repayment_items = loan_account.get_repayment_items()

        last_item = allocation_order[-1]
        allocation_balance = amount
        allocation = []
        
        for item in allocation_order:
            if item == LoanAllocationItem.LIABILITY:
                allocation_balance += repayment_items[item]
                allocation.append(LoanRepaymentAllocation(repayment_items[item], item))
            else:
                if (repayment_items[item] <= allocation_balance > 0):
                    if item == last_item:
                        allocation.append(LoanRepaymentAllocation(allocation_balance, item))
                        break
                    else:
                        allocation_balance -= repayment_items[item]
                        allocation.append(LoanRepaymentAllocation(repayment_items[item], item))

                elif (repayment_items[item] > allocation_balance > 0):
                    allocation.append(LoanRepaymentAllocation(allocation_balance, item))
                    allocation_balance = 0

                    break
            
        return allocation

    
    def allocate_loan_transaction_amount(loan_transaction, amount, overpayment):
        logger.debug('allocate_loan_transaction_amount({loan_transaction})')

        with db_transaction.atomic():
            assert (loan_transaction.transaction_type == LoanTransactionType.LOAN_REPAYMENT), (
                "Not a loan repayment transaction")

            entries = []
            allocations = allocate_repayment_amount(loan_transaction, amount)
            
            for allocation in allocations:
                logger.debug(f"Allocating {allocation.item.get_text()} amount {allocation.amount}")

                if allocation.amount <= 0:
                    continue

                if allocation.item in (
                    LoanAllocationItem.PENALTY,
                    LoanAllocationItem.FEES,
                    LoanAllocationItem.INTEREST,
                    LoanAllocationItem.PRINCIPAL
                ):
                    if allocation.item == LoanAllocationItem.PENALTY:
                        credit_account = LoanLedgerAccount.objects\
                            .get(account_type=LoanLedgerAccountType.PENALTIES_RECEIVABLE)

                    elif allocation.item == LoanAllocationItem.FEES:
                        credit_account = LoanLedgerAccount.objects\
                            .get(account_type=LoanLedgerAccountType.TRANSACTION_FEES_EXPENSE)
                    
                    elif allocation.item == LoanAllocationItem.INTEREST:
                        credit_account = LoanLedgerAccount.objects\
                            .get(account_type=LoanLedgerAccountType.INTEREST_RECEIVABLE)
                    
                    elif allocation.item == LoanAllocationItem.PRINCIPAL:
                        credit_account = LoanLedgerAccount.objects\
                            .get(account_type=LoanLedgerAccountType.LOAN_PORTFOLIO)

                    debit_account = LoanLedgerAccount.objects\
                        .get(account_type=LoanLedgerAccountType.LOAN_FUND_SOURCE)
                    
                    entries += [
                        Entry(
                            ledger_account=debit_account, 
                            amount=allocation.amount, 
                            entry_type=EntryType.DEBIT, 
                            entry_date=None),
                        Entry(
                            ledger_account=credit_account,
                            amount=allocation.amount,
                            entry_type=EntryType.CREDIT,
                            entry_date=None
                        )]

                elif allocation.item == LoanAllocationItem.LIABILITY:
                    debit_account = LoanLedgerAccount.objects\
                        .get(account_type=LoanLedgerAccountType.LOAN_LIABILITIES)
                    credit_account = LoanLedgerAccount.objects\
                        .get(account_type=LoanLedgerAccountType.LOAN_FUND_SOURCE)
                    
                    entries += [
                        Entry(
                            ledger_account=debit_account, 
                            amount=allocation.amount, 
                            entry_type=EntryType.DEBIT, 
                            entry_date=None),
                        Entry(
                            ledger_account=credit_account,
                            amount=-allocation.amount,
                            entry_type=EntryType.CREDIT,
                            entry_date=None
                        )]
                
                else:
                    logger.debug("Unknown allocation item")
                    continue

            if overpayment > 0:
                debit_account = LoanLedgerAccount.objects\
                    .get(account_type=LoanLedgerAccountType.LOAN_FUND_SOURCE)
                credit_account = LoanLedgerAccount.objects\
                    .get(account_type=LoanLedgerAccountType.LOAN_LIABILITIES)

                entries += [
                    Entry(
                        ledger_account=debit_account, 
                        amount=overpayment, 
                        entry_type=EntryType.DEBIT, 
                        entry_date=None),
                    Entry(
                        ledger_account=credit_account,
                        amount=overpayment,
                        entry_type=EntryType.CREDIT,
                        entry_date=None
                    )]

             # make the entries to the ledger
            make_bulk_ledger_entry(loan_transaction, entries)

    #---------

    posted = False
    with db_transaction.atomic():

        #---------
        
        assert loan_transaction.status == LoanTransactionStatus.PROCESSED, (
            "The loan transaction has not been processed"
        )

        loan_account = loan_transaction.loan_account
        
        amount = loan_transaction.amount
        outstanding_balance = loan_account.outstanding_balance
        overpayment = D('0.0')
        balance_cleared = False

        #---------

        if amount < 0:
            logger.warning("Attempting to repay amount less than 0")
            return []

        elif amount > 0:
            if outstanding_balance <= amount:
                logger.info("The user has made an amount greater than then current balance on the loan...")

                if amount > outstanding_balance:
                    overpayment = (D(amount) - D(outstanding_balance))
                    amount = outstanding_balance

                if amount == outstanding_balance:
                    logger.info("The user made a complete payment")
                    balance_cleared = True

            elif outstanding_balance > amount:
                logger.info(f"The user made payment of {amount}, {outstanding_balance - amount} less than the current balance {outstanding_balance}")

        else:
            logger.warning("Attempting to allocate an invalid value")
            return []

        #---------

        if outstanding_balance > 0:
            if loan_account.date_disbursed is None:
                logger.debug("loan_account.date_disbursed is null")
                return

            if (
                loan_account.status in (
                    LoanStatus.ACTIVE,
                    LoanStatus.IN_ARREARS,
                    LoanStatus.DEFAULTED
                ) and
                loan_account.disbursed_less_than_90_days_ago and #days disbursed is less than 90
                loan_account.is_active is True
            ):
                if loan_account.status == LoanStatus.ACTIVE:
                    logger.debug("Active loans less than 60 days old")
                    
                    if loan_account.disbursed_less_than_60_days_ago:
                        logger.debug(f"disbursed_less_than_60_days_ago")
                else:
                    logger.debug(f"loan defaulted/in arrears but less than 90 days old; {loan_account.disbursed_less_than_90_days_ago}")
                    #In this case, the loan in arrears or defaulted, 
                    # but the user makes a repayment before its written off

                # 1. Allocate the amount paid against the due/accruals
                allocate_loan_transaction_amount(loan_transaction, amount, overpayment)

                # 2. update the balances
                from .balances.loan_accounts import update_loan_account_balances
                update_loan_account_balances(loan_account, timezone.now())


                if balance_cleared:
                    loan_account.pay_off_account()
                    loan_account.save()

                posted = True
            elif (
                loan_account.status in (
                    LoanStatus.IN_ARREARS,
                    LoanStatus.ACTIVE,
                    LoanStatus.WRITTEN_OFF,
                    LoanStatus.DORMANT,
                    LoanStatus.CLOSED 
                ) and
                loan_account.disbursed_more_than_90_days_ago # days disbursed less than 60
            ):
                # The loan has or is pending being written off 
                # but the user makes a repayment none the less
                logger.debug(f"loan closed or dormant days > 90; {loan_account.disbursed_more_than_90_days_ago}")
            else:
                logger.debug(f"Loan account #{loan_account.account_id} has invalid state")
        else:
            logger.debug("Loan Balance <= 0")
        
        # -------------
        if posted:
            loan_transaction.status = LoanTransactionStatus.POSTED_TO_LOANS_LEDGER
            loan_transaction.save()

