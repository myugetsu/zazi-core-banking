import logging

from django import forms

from django.core.exceptions import ObjectDoesNotExist

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import (
    check_password, is_password_usable, make_password)

from django.shortcuts import get_object_or_404
from django.utils import timezone

from zazi.core.utils import \
    is_valid_phone_number, validate_phone_number, validate_safaricom_number

from .enums import UserType

logger = logging.getLogger(__name__)


#-------------


class BaseAuthenticationForm(forms.Form):
    phone_number = forms.CharField(
        required=True, 
        max_length=20, 
        label="Phone Number", 
        help_text="Enter your phone number starting with '2547'")
    pin = forms.CharField(
        required=True,
        label="Your security password",
        min_length=4, max_length=8, 
        widget=forms.PasswordInput())

    field_order = ['phone_number', 'pin']

    def clean_phone_number(self):
        phone_number = validate_phone_number(self.cleaned_data['phone_number'])

        if validate_safaricom_number(phone_number):
            return phone_number

        raise forms.ValidationError("Invalid Safaricom Number")


class BaseLoginForm(BaseAuthenticationForm):
    def _get_user(self):
        pass

    def _check_password(self, phone_number, pin):
        return False
    
    def clean(self):
        pin = self.cleaned_data.get('pin')
        phone_number = self.cleaned_data.get('phone_number')

        if pin and phone_number:
            login_approved = self._check_password(phone_number, pin)
            
            if not login_approved:
                raise forms.ValidationError("Username or Password is in invalid. Please try again.")

        return self.cleaned_data


#--------------

def InviteMemberForm(data, user, *args, **kwargs):
    
    class _InviteMemberForm(forms.Form):
        phone_number = forms.CharField(
            required=True, 
            max_length=20, 
            label="Phone Number", 
            help_text="Enter your invitee's phone number starting with '2547'")

        def clean_phone_number(self):
            phone_number = validate_phone_number(self.cleaned_data['phone_number'])

            if not validate_safaricom_number(phone_number):
                raise forms.ValidationError("Invalid Safaricom Number")

            if user.username == phone_number:
                raise forms.ValidationError("Sorry, You cannot invite yourself.")

            return phone_number

    return _InviteMemberForm(data, *args, **kwargs)


class VerifyInviteeForm(forms.Form):
    phone_number = forms.CharField(
        required=True, 
        max_length=20, 
        label="Phone Number", 
        help_text="Enter your phone number starting with '2547'")
    invitation_code = forms.CharField(
        required=True,
        label="Your Invitation Code",
        min_length=4, max_length=8)

    def clean_phone_number(self):
        phone_number = validate_phone_number(self.cleaned_data['phone_number'])

        if not validate_safaricom_number(phone_number):
            raise forms.ValidationError("Invalid Safaricom Number")

        return phone_number

    def clean(self):
        cleaned_data = super().clean()

        phone_number = cleaned_data.get('phone_number')
        invitation_code = (cleaned_data.get('invitation_code') or "").upper()

        if get_user_model().objects.filter(
            username=phone_number
        ).exists():
            raise forms.ValidationError("The invitation has alredy been redeemed. Thank you.")

        from .models import UserInvitation
        if not UserInvitation.objects.filter(
            invited_by__isnull=False,
            redeemed_at__isnull=True,
            phone_number=phone_number,
            invitation_code=invitation_code,
            expires_at__gt=timezone.now()
        ).exists():
            raise forms.ValidationError(
                "User's invitation is invalid or has expired.")

        return cleaned_data


#--------------


class LoginForm(BaseLoginForm):
    def _get_user(self):
        try:
            return self._user
        except AttributeError:
            self._user = get_user_model()\
                .objects\
                .get(username=self.cleaned_data.get('phone_number'))
            return self._user

    def _check_password(self, phone_number, pin):
        try:
            user = self._get_user()

            if user.user_account.user_type == UserType.LOANEE:
                from .models import Authentication

                try:
                    authentication = Authentication.objects\
                        .get(user=user, expires__gt=timezone.now())
                except Authentication.DoesNotExist as e:
                    logger.exception(e)

                    raise forms.ValidationError("Not allowed to login here")

                def setter(pin):
                    authentication.security_pin = make_password(pin)
                    authentication.save(update_fields=["security_pin"])

                return check_password(pin, authentication.security_pin, setter)
            else:
                raise forms.ValidationError("Not allowed to login here")

        except (ObjectDoesNotExist, Exception) as e:
            logger.exception(e)
            
            return False

    def generate_token(self):
        from .models import Token
        
        return Token\
            .objects\
            .create(user=self._get_user())
            

#-------------


class SecureAccountForm(forms.Form):
    pin = forms.CharField(
        required=True,
        label="Enter your security PIN",
        min_length=4, max_length=8, 
        widget=forms.PasswordInput())
    repeat_pin = forms.CharField(
        required=True,
        label="Repeat your security PIN",
        min_length=4, max_length=8, 
        widget=forms.PasswordInput())

    def clean(self):
        cleaned_data = super().clean()

        pin = cleaned_data.get('pin')
        repeat_pin = cleaned_data.get('repeat_pin')

        if pin != repeat_pin:
            raise forms.ValidationError("The two PINs are not similar, please try again.")

        return cleaned_data


class _RequestResetPINForm(forms.Form):
    requestee_phone_number = forms.CharField(
        required=True, 
        max_length=20, 
        label="Phone Number", 
        help_text="Enter your phone number starting with '2547'")

    def clean_requestee_phone_number(self):
        phone_number = validate_phone_number(self.cleaned_data['requestee_phone_number'])

        if not validate_safaricom_number(phone_number):
            raise forms.ValidationError("Invalid Safaricom Number")

        return phone_number


def RequestResetPINForm(data):
    return _RequestResetPINForm(data)

class _BaseResetPINForm(forms.Form):
    pin = forms.CharField(
        required=True,
        label="Enter your security PIN",
        min_length=4, max_length=8, 
        widget=forms.PasswordInput())
    
def ResetPINForm(data, user):
    if user.is_superuser:
        class _ResetPINForm(_BaseResetPINForm):
            pass
    else:
        class _ResetPINForm(_BaseResetPINForm):
            pass

    return _ResetPINForm(data)