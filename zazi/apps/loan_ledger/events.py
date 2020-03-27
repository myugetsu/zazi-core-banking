import logging

from decimal import Decimal as D

from django.utils import timezone

from zazi.core import json

from . import utils as api

#--------------

logger = logging.getLogger(__name__)

#--------------


def accrue_loan_interest(event, context):
    logger.debug(f"accrue_loan_interest({event}, {context})")

    kwargs = event.get("kwargs")
    logger.debug(kwargs)

    api.accrue_all_active_loans(**kwargs)


def update_loan_ledger_balances(event, context):
    logger.debug(f"update_loan_ledger_balances({event}, {context})")

    kwargs = event.get("kwargs")
    logger.debug(kwargs)

    api.update_loan_ledger_balances(**kwargs)