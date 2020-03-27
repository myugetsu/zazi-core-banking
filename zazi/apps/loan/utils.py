from dateutil.relativedelta import relativedelta
from decimal import Decimal as D

from django.db import transaction as db_transaction, models
from django.utils import timezone

from zazi.apps.users.enums import UserType

from .models import LoanAccount, LoanProfile

#--------------

import logging
logger = logging.getLogger(__name__)

#--------------


def get_loan_profile(user=None, loan_profile_id=None):
    qs = LoanProfile.objects.all()

    if user is not None:
        qs = qs.filter(user_account__user=user)

    if loan_profile_id is not None:
        qs = qs.filter(profile_id=loan_profile_id)

    return qs\
        .get()

def get_active_loan_account(user=None, loan_profile_id=None, loan_account_id=None, product=None, product_name=None):
    # by active user
    q = models.Q(
        loan_profile__user_account__user__is_active=True,
        loan_profile__user_account__user_type=UserType.LOANEE)
    
    if user is not None:
        q &= models.Q(loan_profile__user_account__user=user)

    if loan_profile_id is not None:
        q &= models.Q(loan_profile__profile_id=loan_profile_id)

    # by product
    if product is not None:
        q &= models.Q(product=product)

    if product_name:
        q &= models.Q(product__name=product_name)
    
    # by loan `account_id` if provided
    if loan_account_id:
        q &= models.Q(account_id=loan_account_id)

        return LoanAccount.objects.filter(q).first()

    return LoanAccount.objects.filter(q)

def process_loan_transaction(
    loan_account_id,
    transaction_type,
    amount=None,
    fee=None,
    repayment_amount=None,
):
    with db_transaction.atomic():
        loan_account = LoanAccount.objects\
            .get(account_id=loan_account_id, is_active=True)

        logger.debug("process_loan_transaction() completed successfully")
        
        # lastly, save the account
        loan_account.save()