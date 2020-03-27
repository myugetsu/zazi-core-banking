import logging

from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from django.db import transaction as db_transaction

from .models import \
    MpesaIdentityVerification, IdentityStatus, \
    Identity, IdentityType

# ---------------

logger = logging.getLogger(__name__)

# ---------------

def identity_is_verified(phone_number):
    return Identity.objects.filter(
        status=IdentityStatus.VERIFIED,
        phone_number=phone_number
    ).exists()

def create_identity_profile(user_account, phone_number):
    logger.debug(f"create_identity_profile({phone_number})")

    identity = Identity.objects.create(
        user_account=user_account,
        phone_number=phone_number,
        identity_type=IdentityType.PERSON,
        status=IdentityStatus.UNVERIFIED)

    return identity


def request_mpesa_verification(user):
    logger.debug(f"request_mpesa_verification({user})")

    identity = Identity.objects.get(user_account__user=user)
    
    if identity.status != IdentityStatus.VERIFIED:
        from zazi.apps.mpesa.utils.account import request_mpesa_identity_verification

        try:
            phone_number = user.username
            mpesa_transaction = request_mpesa_identity_verification(phone_number)

            MpesaIdentityVerification.objects.create(
                identity=identity,
                mpesa_transaction=mpesa_transaction,
                initiated_at=timezone.now())
            return True
        except ObjectDoesNotExist as e:
            logger.exception(e)


def process_mpesa_c2b_transaction(mpesa_transaction):
    logger.debug(f"process_mpesa_c2b_transaction({mpesa_transaction})")

    mpesa_identity_verification = MpesaIdentityVerification.objects\
        .get(mpesa_transaction=mpesa_transaction)

    mpesa_transaction.sender_account.is_active = True
    mpesa_transaction.sender_account.save()

    identity = mpesa_identity_verification.identity 
    identity.status = IdentityStatus.VERIFIED
    identity.save()

    user = identity.user_account.user 
    user.is_active = True
    user.save()

    mpesa_identity_verification.validated_at = timezone.now()
    mpesa_identity_verification.save()

    from zazi.apps.loan_ledger.utils import book_identity_verification_amount
    book_identity_verification_amount(identity, mpesa_transaction.transaction_amount)


def capture_identity_details(
    user_account, 
    mpesa_transaction, 
    first_name=None,
    middle_name=None,
    last_name=None,
    phone_number=None,
):
    logger.debug(f"capture_identity_details({user_account}, {mpesa_transaction})")

    with db_transaction.atomic():
        try:
            identity = Identity.objects.get(user_account=user_account)

            if (identity.status != IdentityStatus.VERIFIED) or (not identity.has_captured_names):
                identity.first_name = first_name
                identity.middle_name = middle_name
                identity.last_name = last_name
                identity.phone_number = phone_number

                if identity.user_account_id is None:
                    identity.user_account = user_account
                
                identity.save()
        except ObjectDoesNotExist as e:
            logger.exception(e)

            Identity.objects\
                .create(
                    first_name=first_name,
                    middle_name=middle_name,
                    last_name=last_name,
                    phone_number=phone_number,
                    user_account=user_account,
                    status=IdentityStatus.UNVERIFIED)

        except MultipleObjectsReturned as e:
            logger.exception(e)
            
            identity = user_account.identities.filter(
                user_account=user_account,
                phone_number=phone_number
            ).first()

            identity.first_name = first_name
            identity.middle_name = middle_name
            identity.last_name = last_name
            
            identity.save()


    logger.debug(f"capture_identity_details({user_account}, {mpesa_transaction})")