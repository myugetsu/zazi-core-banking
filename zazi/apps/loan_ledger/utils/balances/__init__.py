from decimal import Decimal as D
from django.db import models, transaction as db_transaction

from zazi.apps.loan.models import LoanAccount, LoanStatus
from zazi.core import time as core_time

from .. import accruals
from . import loan_accounts, ledger_accounts, general_ledger


#--------------

import logging
logger = logging.getLogger(__name__)

#--------------

def update_loan_ledger_balances(time=None, *args, **kwargs):
    """
    This is called every top of the hour... Always...
    
    """
    logger.debug('update_loan_ledger_balances()')

    #-----------------

    with db_transaction.atomic():
        if time is None:
            time = core_time.top_of_the_hour()

        # 1. Accrue all active loans
        accruals.accrue_all_active_loans(time=time)

        # 2. Writeoff all loans past 90 days with balance
        accruals.write_off_all_loans_past_90_days(time=time)

        if core_time.is_start_of_new_day(time=time):
            logger.debug("Is start of new day!")
            
            # 3. Close the loan account balances
            loan_accounts.update_all_active_loan_account_balances(time)

            # 4. if its a new day, close balances
            ledger_accounts.close_loan_ledger_accounts(time) 

            if core_time.is_start_of_new_month(time=time):
                logger.debug("Is start of new Month!")
                # general_ledger.post_to_general_ledger(time=time)
            
        # else:
        #     loan_accounts.pay_off_loans_with_cleared_balances(time)
            
        #     logger.debug("Not start of day, Exiting...")