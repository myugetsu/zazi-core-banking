from django import forms
from django.apps import apps

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import (
    NumericPasswordValidator, 
    CommonPasswordValidator)

from zazi.core.utils import is_valid_phone_number

from .models import MpesaAPIAccount, MpesaAccount, MpesaOrganization
from .enums import IdentifierType, DocumentType, AccountType

User = get_user_model()

def check_short_code(short_code):
    if MpesaAccount.objects.filter(
        identifier_type=IdentifierType.BUSINESS_PAYBILL,
        identifier=short_code
    ).exists():
        return short_code
        
    raise forms.ValidationError("Short code '%s' not found. Set it up first")


class BorrowForm(forms.Form):
    amount = forms.DecimalField(max_value=settings.HARD_LOAN_LIMIT, min_value=0, decimal_places=0)


class B2BForm(forms.Form):
    sender_short_code = forms.CharField(max_length=20, required=True)
    receiver_short_code = forms.CharField(max_length=20, required=True)
    
    amount = forms.DecimalField(required=True, min_value=0, max_value=5000000)

    def clean_sender_short_code(self):
        return check_short_code(self.cleaned_data['sender_short_code'])

    def clean_receiver_short_code(self):
        return check_short_code(self.cleaned_data['receiver_short_code'])
        

class C2BForm(forms.Form):
    short_code = forms.CharField(max_length=30)

    validation_url = forms.URLField(required=False)
    confirmation_url = forms.URLField(required=False)

    def clean_short_code(self):
        return check_short_code(self.cleaned_data['short_code'])


class B2CForm(forms.Form):
    short_code = forms.CharField(max_length=30)
    phone_number = forms.CharField(max_length=30)

    amount = forms.DecimalField(required=True, min_value=0, max_value=10000)
    notes = forms.CharField(max_length=100, required=True)

    def clean_short_code(self):
        return check_short_code(self.cleaned_data['short_code'])

    def clean_phone_number(self):
        phone_number = self.cleaned_data['phone_number']

        if MpesaAccount.objects.filter(
            identifier_type=IdentifierType.PERSONAL_MPESA,
            identifier=phone_number
        ).exists():
            return phone_number

        raise forms.ValidationError("Phone number not found.")

        


class CheckTransactionStatusForm(forms.Form):
    transaction_id = forms.CharField(max_length=20)
    notes = forms.CharField(max_length=250, required=False)

# ----------

class OrganizationForm(forms.ModelForm):
    class Meta:
        model = MpesaOrganization
        fields = [
            'name'
        ]


class PersonalAccountForm(forms.Form):
    phone_number = forms.CharField(max_length=20, required=True)

    first_name = forms.CharField(max_length=20)
    middle_name = forms.CharField(max_length=20)
    last_name = forms.CharField(max_length=20)
    
    def clean_identifier(self):
        phone_number = validate_phone_number(self.cleaned_data['identifier'])

        if not MpesaAccount.objects.filter(
            identifier_type=IdentifierType.PERSONAL_MPESA,
            identifier=phone_number
        ).exists():
            return phone_number
        else:
            raise forms.ValidationError("Unavailable phone number")


class AuthenticationForm(forms.Form):
    short_code = forms.CharField(max_length=20, required=True)

    def clean_sender_short_code(self):
        return check_short_code(self.cleaned_data['short_code'])

# ---------


class APIC2BForm(forms.Form):
    TransID = forms.CharField(max_length=20)
    TransactionType = forms.CharField(max_length=50, required=False)
    TransTime = forms.CharField(max_length=15)
    TransAmount = forms.DecimalField(max_value=10000, min_value=0, max_digits=7, decimal_places=2)
    
    MSISDN = forms.CharField(max_length=15)

    FirstName = forms.CharField(max_length=50, required=False)
    MiddleName = forms.CharField(max_length=50, required=False)
    LastName = forms.CharField(max_length=50, required=False)

    BusinessShortCode = forms.CharField(max_length=7)
    
    BillRefNumber = forms.CharField(max_length=40)
    InvoiceNumber = forms.CharField(max_length=40, required=False)
    OrgAccountBalance = forms.CharField(max_length=40, required=False)
    ThirdPartyTransID = forms.CharField(max_length=40, required=False)

    def clean_sender_short_code(self):
        return check_short_code(self.cleaned_data['BusinessShortCode'])

    def clean_MSISDN(self):
        phone_number = self.cleaned_data['MSISDN']

        if MpesaAccount.objects.filter(
            identifier_type=IdentifierType.PERSONAL_MPESA,
            identifier=phone_number
        ).exists():
            return phone_number

        raise forms.ValidationError("Phone number not found.")
        