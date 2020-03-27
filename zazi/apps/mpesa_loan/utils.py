import logging

from decimal import Decimal as D
from dateutil.relativedelta import relativedelta

from django.conf import settings
from django.db import models, transaction as db_transaction
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist

from zazi.apps.loan.enums import \
    LoanStatus, LoanTransactionStatus, PaymentPlatform, \
    LoanTransactionType, LoanProfileStatus, LoanProductType
from zazi.apps.loan.models import \
    LoanProduct, LoanTransaction, LoanApplication, LoanAccount, LoanAccount, LoanProfile

from zazi.apps.mpesa import utils as mpesa
from zazi.apps.mpesa.models import MpesaOrganization
from zazi.apps.mpesa.enums import MpesaC2BAPIType, MpesaTransactionCategory
from zazi.apps.mpesa.utils.transaction import \
    request_mpesa_express_stk_push, request_b2c_transaction

from zazi.apps.identity.utils import capture_identity_details, create_identity_profile

from zazi.core import json, rounding

from .models import MpesaLoanAccount, MpesaLoanTransaction
from . import queue
from .models import generate_id

# ---------------

logger = logging.getLogger(__name__)

# --------------


def create_mpesa_loan_account(phone_number, user_account, organization=None, product_name="mpesa_revolving_loan"):
    logger.debug(f"create_mpesa_loan_account({phone_number}, {user_account}, {organization}, {product_name})")
    
    with db_transaction.atomic():
        if organization is None:
            organization = MpesaOrganization.objects.get()
        
        personal_mpesa_account = mpesa.create_personal_account(
            organization.organization_id, 
            user_account.user.username)

        product = LoanProduct.objects.get(name=product_name)
        loan_profile = LoanProfile.objects.create(
            user_account=user_account,
            status=LoanProfileStatus.CLEAN)

        loan_account = LoanAccount.objects.create(
            is_active=True,
            product=product, 
            loan_profile=loan_profile)

        create_identity_profile(user_account, phone_number)

        logger.debug(f"complete create_mpesa_loan_account({user_account}, {organization}, {product_name})")
        return MpesaLoanAccount.objects.create(
            loan_account=loan_account,
            is_active=True,
            mpesa_account=personal_mpesa_account)


# ----------------


def process_loan_application(loan_application=None, loan_application_id=None):
    logger.debug(f"process_loan_application({loan_application}, {loan_application_id})")

    with db_transaction.atomic():
        time_now = timezone.now()

        if loan_application is None:
            loan_application = LoanApplication.objects.get(
                payment_platform=PaymentPlatform.MPESA,
                application_id=loan_application_id)

        if loan_application.amount > loan_application.loan_profile.loan_limit:
            loan_amount = loan_application.loan_profile.loan_limit
        else:
            loan_amount = loan_application.amount
        
        loan_amount = rounding\
            .round_down(loan_amount, decimal_places=0)

        logger.debug(f"Loan application #{loan_application_id}. Amount {loan_application.amount} >= {loan_amount} via mpesa @ {timezone.localtime()}")
        logger.debug(f"Loan profile: #{loan_application.loan_profile}")

        loan_account = LoanAccount.objects\
            .filter(
                status__in=(
                    LoanStatus.PENDING_DISBURSEMENT, 
                    LoanStatus.CLEAN, 
                    LoanStatus.PAID_OFF),
                product__product_type=LoanProductType.REVOLVING_LOAN,
                product__payment_platform=PaymentPlatform.MPESA)\
            .filter(
                loan_profile=loan_application.loan_profile,
                loan_profile__user_account__user__is_active=True,
                loan_profile__effective_loan_limit__gte=loan_amount,
                loan_profile__status__in=(
                    LoanProfileStatus.PERFORMING,
                    LoanProfileStatus.CLEAN
                ))\
            .get()

        logger.debug(loan_application.loan_profile)
        logger.debug(loan_account)

        #1. 
        mpesa_loan_account = MpesaLoanAccount.objects\
            .get(
                loan_account=loan_account, 
                is_active=True,
                loan_account__is_active=True)
        
        #2. 
        loan_transaction = LoanTransaction.objects\
            .create(
                status=LoanTransactionStatus.PENDING_PROCESSING,
                transaction_type=LoanTransactionType.LOAN_DISBURSAL,
                initiated_at=time_now,
                loan_account=loan_account,
                amount=loan_application.amount)

        # Now make the request to mpesa
        mpesa_transaction = mpesa.b2c_transaction(
            mpesa_loan_account.mpesa_account, 
            loan_amount,
            transaction_category=MpesaTransactionCategory.LOAN_TRANSACTION)

        logger.debug(f"successful process_loan_application({loan_application}, {loan_application_id})")
        return MpesaLoanTransaction.objects\
            .create(
                mpesa_transaction=mpesa_transaction,
                loan_transaction=loan_transaction)


# ----------------


def process_loan_disbursal(mpesa_loan_transaction):
    with db_transaction.atomic():
        logger.debug(f"process_loan_disbursal({mpesa_loan_transaction})")

        mpesa_transaction = mpesa_loan_transaction.mpesa_transaction
        loan_transaction = mpesa_loan_transaction.loan_transaction
        loan_account = loan_transaction.loan_account
        
        loan_transaction.status = LoanTransactionStatus.PROCESSED
        loan_transaction.processed_at = timezone.now()
        loan_transaction.amount = (
            mpesa_transaction.transaction_amount + 
            mpesa_transaction.transaction_charge)
        
        # capture the identity details in the mpesa transaction to the loan profile
        loan_profile = loan_account.loan_profile
        capture_identity_details(
            loan_profile.user_account, 
            mpesa_transaction,
            first_name=mpesa_transaction.response_payload.get('transaction_recipient_first_name'),
            middle_name=mpesa_transaction.response_payload.get('transaction_recipient_middle_name'),
            last_name=mpesa_transaction.response_payload.get('transaction_recipient_last_name'),
            phone_number=mpesa_transaction.response_payload.get('transaction_recipient_phone'))

        loan_account.amount_disbursed = mpesa_transaction.transaction_amount
        loan_account.date_disbursed = timezone.now()
        logger.debug(f"loan_account.amount_disbursed = {loan_account.amount_disbursed}")

        #TODO: Delegate to the jobs service
        from zazi.apps.loan_ledger.utils import book_disbursal
        book_disbursal(loan_transaction, 
            disbursed_amount=mpesa_transaction.transaction_amount,
            disbursal_fee=mpesa_transaction.transaction_charge)

        loan_account.status = LoanStatus.ACTIVE
        loan_account.save()

        loan_transaction.save()
        logger.debug(f"Successfully completed process_loan_disbursal({mpesa_transaction})")


def process_loan_repayment(mpesa_loan_transaction):
    logger.debug(f"process_loan_repayment({mpesa_loan_transaction})")

    with db_transaction.atomic():
        loan_transaction = mpesa_loan_transaction.loan_transaction
        
        logger.debug(f"process_loan_repayment({mpesa_loan_transaction})")
        
        from zazi.apps.loan_ledger.utils import book_repayment
        book_repayment(loan_transaction)


# --------------------


def process_loan_repayment_request(loan_account_id=None, loan_transaction_id=None, repayment_amount=None):
    logger.debug(f"process_loan_repayment_request({loan_account_id}, {loan_transaction_id}, {repayment_amount})")
    
    with db_transaction.atomic():
        time_now = timezone.now()
        five_minutes_ago = time_now - relativedelta(minutes=5)

        # ---------------
        # get loan via loan_transaction_id

        loan_transaction = LoanTransaction.objects\
            .filter(
                transaction_id=loan_transaction_id,
                transaction_type=LoanTransactionType.LOAN_REPAYMENT)\
            .filter(
                loan_account__status__in=(
                    LoanStatus.DISBURSED,
                    LoanStatus.ACTIVE,
                    LoanStatus.IN_ARREARS
                ),
                processed_at__isnull=True,
                status=LoanTransactionStatus.PENDING_PROCESSING)\
            .filter(initiated_at__gte=five_minutes_ago)\
            .get()
        
        # ---------------

        mpesa_loan_account = MpesaLoanAccount.objects\
            .get(
                loan_account__account_id=loan_account_id, 
                loan_account__is_active=True)
        personal_mpesa_account = mpesa_loan_account.mpesa_account

        assert mpesa_loan_account.loan_account.current_balance.outstanding_balance > 0, "Loan balance has to be more than 0"
        
        # ---------------

        # make request to mpesa for loan repayment, via the STK Push interface
        mpesa_transaction = mpesa.c2b_transaction(
            personal_mpesa_account, 
            rounding.round_up(repayment_amount, decimal_places=0),
            transaction_category=MpesaTransactionCategory.LOAN_TRANSACTION)

        # Link the mpesa transaction and the loan transaction
        mpesa_loan_transaction = MpesaLoanTransaction.objects\
            .create(
                mpesa_transaction=mpesa_transaction, 
                loan_transaction=loan_transaction)

        logger.debug("created new mpesa loan transaction #%s" % 
            mpesa_loan_transaction.loan_transaction.transaction_id)

        # ---------------

        loan_transaction.status = LoanTransactionStatus.PROCESSED
        loan_transaction.processed_at = time_now
        loan_transaction.save()

    logger.debug(f"completed process_loan_repayment_request({loan_account_id}, {loan_transaction_id}, {repayment_amount})")
    return mpesa_loan_transaction


# ---------------
# MPESA Replies


def process_mpesa_b2c_transaction(mpesa_transaction_id=None):
    logger.debug(f"Starting process_mpesa_b2c_transaction({mpesa_transaction_id})")

    with db_transaction.atomic():
        #TODO: Notify several services that we sent an MPESA payment to an account
        mpesa_loan_transaction = MpesaLoanTransaction.objects\
            .filter(
                loan_transaction__transaction_type=LoanTransactionType.LOAN_DISBURSAL,
                loan_transaction__status=LoanTransactionStatus.PENDING_PROCESSING,
                loan_transaction__loan_account__is_active=True)\
            .filter(
                mpesa_transaction__sender_account__is_active=True,
                mpesa_transaction__recipient_account__is_active=True,
                mpesa_transaction__transaction_id=mpesa_transaction_id)\
            .get()

        process_loan_disbursal(mpesa_loan_transaction)


def process_mpesa_c2b_transaction(mpesa_transaction=None, mpesa_transaction_id=None):
    logger.debug(f"process_mpesa_c2b_transaction({mpesa_transaction_id})")

    with db_transaction.atomic():
        two_minutes_ago = timezone.now() - relativedelta(minutes=2)

        if mpesa_transaction_id:
            qs = MpesaLoanTransaction.objects\
                .filter(mpesa_transaction__transaction_id=mpesa_transaction_id)
        else:
            qs = MpesaLoanTransaction.objects\
                .filter(mpesa_transaction=mpesa_transaction)

        # 1. It might be an mpesa loan transaction
        mpesa_loan_transaction = qs\
            .filter(
                loan_transaction__transaction_type=LoanTransactionType.LOAN_REPAYMENT,
                loan_transaction__initiated_at__gte=two_minutes_ago,
                loan_transaction__posted_at__isnull=True
            )\
            .filter(
                mpesa_transaction__sender_account__is_active=True,
                mpesa_transaction__recipient_account__is_active=True
            )\
            .get()

        
        process_loan_repayment(mpesa_loan_transaction)

        logger.debug(f"Successfully completed process_mpesa_c2b_transaction({mpesa_transaction})")


