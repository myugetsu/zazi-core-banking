from decimal import Decimal as D

from django.db import models, transaction as db_transaction
from dateutil.relativedelta import relativedelta

from zazi.core import time as core_time

from zazi.apps.loan.models import LoanTransaction, LoanAccount, LoanStatus
from zazi.apps.general_ledger.models import \
    GLAccount, GLPeriodClosure, GLTransactionEntry

from ...models import \
    LoanLedgerAccountingLink, \
    LoanLedgerAccount, EntryType

from .. import accruals


#--------------

import logging
logger = logging.getLogger(__name__)

#--------------

def post_to_general_ledger(closure_group=None, time=None):
    logger.debug('post_to_general_ledger()')

    top_of_the_hour = core_time.top_of_the_hour(time=time)

    with db_transaction.atomic():
        #frst day, first hour of the month
        try:
            closure_group = GLPeriodClosure.objects.latest('period_end')
        except GLPeriodClosure.DoesNotExist:
            closure_group = None
            
        try:
            for accounting_link in LoanLedgerAccountingLink.objects.all():
                gl_account = accounting_link.gl_account

                if closure_group and closure_group.previous_period_id:
                    previous_closure_group = closure_group.previous_period

                    entry = previous_closure_group\
                        .transaction_entries\
                        .filter(gl_account=gl_account)\
                        .latest('entry_date')

                    balance_bf = entry.balance_bf
                    balance_cf = entry.balance
                else:
                    balance_bf = D('0.0')
                    balance_cf = D('0.0')

                GLTransactionEntry.objects.create(
                    closure_group=closure_group,
                    gl_account=gl_account,
                    balance_bf=(balance_bf + balance_cf),
                    balance=(loan_ledger_entry.balance_bf + loan_ledger_entry.balance),
                    entry_date=top_of_the_hour)
        except LoanLedgerAccount.DoesNotExist as e:
            logger.exception(e)
            #TODO: Raise system setup exception...
            return
        except GlAccount.DoesNotExist as e:
            logger.exception(e)
            #TODO: Raise system setup exception...
            return

