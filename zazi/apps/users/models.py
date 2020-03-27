import re

import datetime

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from dateutil.relativedelta import relativedelta

from zazi.core.base import BaseModel
from zazi.core.utils import generate_id

from .enums import UserStatus, UserType

from .domain import \
    User as UserTuple, \
    UserAccount as UserAccountTuple


def generate_token(no_of_chars=50):
    try:
        import secrets
        token = secrets.token_urlsafe(no_of_chars)
    except ImportError:
        import binascii, os
        token = binascii.hexlify(os.urandom(256)).decode()

    return re.sub(r'[_\W]+', '', token[:no_of_chars])


def get_invitation_id():
    return generate_token(no_of_chars=25).lower()

def get_reset_id():
    return generate_token(no_of_chars=25).lower()

def get_invitation_code():
    return (generate_token(no_of_chars=5)).upper()

def get_reset_code():
    return (generate_token(no_of_chars=4)).upper()


class UserInvitation(BaseModel):
    invitation_id = models.CharField(max_length=50, null=True, default=get_invitation_id)

    phone_number = models.CharField(max_length=20)
    invited_by = models.ForeignKey('UserAccount', models.CASCADE, null=True, related_name='invitations')

    invitation_code = models.CharField(max_length=6, default=get_invitation_code)

    sms_verification_code = models.CharField(max_length=10, null=True, blank=True)
    sms_verified_at = models.DateTimeField(null=True, blank=True)

    expires_at = models.DateTimeField()
    redeemed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('phone_number', 'invitation_code')

    def __str__(self):
        return self.invitation_code


#------


class Authentication(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, models.CASCADE, related_name="user_authentication")

    security_pin = models.CharField(max_length=250, null=True)
    expires = models.DateTimeField(null=True)

    created_at = models.DateTimeField(null=True, auto_now_add=True)
    updated_at = models.DateTimeField(null=True, auto_now=True)

    class Meta:
        db_table = "user_authentication"

    def set_security_pin(self, pin, save=False):
        from django.contrib.auth.hashers import make_password
        
        self.security_pin = make_password(pin)
        self.expires = (timezone.now() + datetime.timedelta(days=(30*3)))

        if save:
            self.save()


class UserAccount(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        models.CASCADE, null=True, 
        related_name='user_account')

    account_id = models.CharField(max_length=100, unique=True, default=generate_id)

    user_type = models.PositiveSmallIntegerField(choices=UserType.choices(), null=True)
    status = models.PositiveSmallIntegerField(choices=UserStatus.choices(), null=True)

    class Meta:
        db_table = 'user_profile'

    def __str__(self):
        return self.account_id

    def get_user_dict(self):
        return dict(
            username=self.user.username,
            first_name=self.user.first_name,
            last_name=self.user.last_name,
            email=self.user.email,
            is_staff=self.user.is_staff,
            is_active=self.user.is_active,
            date_joined=self.user.date_joined)

    def as_dict(self):
        return dict(
            account_id=self.account_id,
            status=self.status,
            user=self.get_user_dict())


#-------------


class TokenManager(models.Manager):
    def create(self, access=None, refresh=None, *args, **kwargs):
        if access is None:
            access  = generate_token()
        
        if refresh is None:
            refresh = generate_token()

        expires = (timezone.now() + relativedelta(seconds=3600))

        return super().create(
            expires=expires,
            refresh=refresh,  
            access=access, 
            *args, **kwargs)

    def check_token(self, token):
        return self\
            .get_queryset()\
            .filter(
                access=token,
                expires__gt=timezone.now())\
            .exists()


class Token(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, models.CASCADE)

    access = models.CharField(max_length=70)
    refresh = models.CharField(max_length=70, null=True)

    expires = models.DateTimeField()

    objects = TokenManager()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return "[%s]: " % self.access


#------------


class ResetPINCode(BaseModel):
    reset_id = models.CharField(max_length=50, null=True, default=get_reset_id)
    reset_code = models.CharField(max_length=6, default=get_reset_code)

    requestee = models.ForeignKey(settings.AUTH_USER_MODEL, models.CASCADE, related_name='pin_codes')

    reset_on = models.DateTimeField(null=True)
    expires = models.DateTimeField(null=True)

    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, models.CASCADE, related_name='pin_change_requests')
    requested_on = models.DateTimeField(null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return "[%s]: " % self.reset_code

    def as_dict(self):
        return dict(
            reset_id=self.reset_id,
            reset_code=self.reset_code,
            reset_on=self.reset_on,
            expires=self.expires,
            requestee_phone_number=self.requestee.username,
            requested_by=self.requested_by.username,
            requested_on=self.requested_on)