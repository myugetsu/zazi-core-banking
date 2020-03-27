import logging
import datetime

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

from django.db import transaction as db_transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from zazi.apps.mpesa import utils as mpesa
from zazi.apps.mpesa_loan import utils as mpesa_loans
from zazi.apps.mpesa.enums import AccountType, IdentifierType

from zazi.apps.identity.utils import identity_is_verified
from zazi.core.utils import validate_phone_number

from .enums import UserType, UserStatus
from .models import UserAccount, UserInvitation, Authentication, ResetPINCode


#-------------

logger = logging.getLogger(__name__)

#-------------

def request_user_pin_reset(requestor, requestee_phone_number):
    requestee = get_user_model().objects\
        .get(username=requestee_phone_number)

    return ResetPINCode.objects.create(
        requestee=requestee,
        expires=timezone.now() + datetime.timedelta(hours=12),
        requested_by=requestor,
        requested_on=timezone.now())


def get_pending_invitation(user, phone_number_invited):
    return UserInvitation.objects.get(
        phone_number=phone_number_invited,
        invited_by__user=user,
        expires_at__gt=timezone.now(),
        redeemed_at__isnull=True)


def create_member_invitation(user, phone_number, expiry_days=settings.INVITATION_EXPIRY_PERIOD, is_verified=None):
    if is_verified is None:
        is_verified = identity_is_verified(phone_number)

    if is_verified:
        inviter_user_account = UserAccount.objects.get(user=user)
        invitee_user_account = UserAccount.objects.get(user__username=phone_number)

        expires_at = timezone.now()
    else:
        expires_at = timezone.now() + datetime.timedelta(days=expiry_days) 
        
    return UserInvitation.objects.create(
        phone_number=phone_number,
        invited_by=user.user_account,
        expires_at=expires_at)


def create_end_user(phone_number, invitation_code):
    User = get_user_model()

    with db_transaction.atomic():
        user = User\
            .objects\
            .create(
                username=phone_number,
                is_active=False)

        try:
            invitation = UserInvitation.objects\
                .get(
                    invited_by__isnull=False,
                    redeemed_at__isnull=True,
                    phone_number=phone_number,
                    invitation_code=invitation_code,
                    expires_at__gt=timezone.now())
            
            invitation.redeemed_at = timezone.now()
            invitation.expires_at  = timezone.now()
            invitation.save()

            inviter_user_account = invitation.invited_by
            invitee_user_account = UserAccount.objects\
                .create(
                    user=user,
                    user_type=UserType.LOANEE,
                    status=UserStatus.VERIFIED)
            mpesa_loans\
                .create_mpesa_loan_account(phone_number, invitee_user_account)
        except ObjectDoesNotExist as e:
            logger.exception(e)

        return user

def get_reset_pin_code(pin_reset_id):
    return ResetPINCode.objects\
        .get(
            reset_id=pin_reset_id,
            reset_on__isnull=True,
            expires__gte=timezone.now())


def reset_pin(reset_pin_code, pin):
    user = reset_pin_code.requestee

    time_now = timezone.now()
    reset_pin_code.expires = time_now
    reset_pin_code.reset_on = time_now
    
    reset_pin_code.save()

    auth = Authentication.objects.get(user=user)
    auth.expires = timezone.now()
    auth.set_security_pin(pin, save=True)

    return True