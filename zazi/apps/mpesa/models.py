# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import os
import boto3
import logging

from decimal import Decimal as D

from django.conf import settings
from django.contrib.postgres.fields import JSONField
from django.db import models
from django.utils import timezone

from django.contrib.auth.models import User

from zazi.core import json
from zazi.core.utils import generate_id
from zazi.core.base import BaseModel

from .enums import *

logger = logging.getLogger(__name__)


class MpesaOrganization(BaseModel):
    name = models.CharField(max_length=100)
    organization_id = models.CharField(max_length=100, default=generate_id)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True)

    class Meta:
        db_table = "mpesa_organization"

    def __str__(self):
        return "Organization %s" % self.name


class MpesaAPIAccount(BaseModel):
    organization = models.ForeignKey('MpesaOrganization', on_delete=models.CASCADE, null=True)

    linked_account = models.OneToOneField('MpesaAccount', 
        on_delete=models.CASCADE, 
        related_name='api_account', 
        null=True)

    in_production = models.BooleanField(default=False)

    consumer_key = models.CharField(max_length=40)
    consumer_secret = models.CharField(max_length=20)

    username  = models.CharField(max_length=30, null=True, blank=True)
    security_credential = models.CharField(max_length=30, null=True, blank=True)

    user_type = models.PositiveSmallIntegerField(choices=UserType.choices(), null=True, blank=False)

    def __str__(self):
        return "API Account %s" % self.linked_account.identifier

    class Meta:
        db_table = "mpesa_api_account"
        unique_together = ('consumer_key', 'consumer_secret')


#--------


class LipaNaMpesaAccount(BaseModel):
    account = models.ForeignKey('MpesaAccount', on_delete=models.CASCADE, related_name='lipa_na_mpesa_accounts')
    pass_code = models.CharField(max_length=70, null=True, blank=True)

    class Meta:
        db_table = "lipa_na_mpesa_account"

    def __str__(self):
        return "LNM Account %s" % self.account.account_id


class MpesaAccountRegisteredURL(BaseModel):
    reference = models.CharField(max_length=30, default=generate_id)
    mpesa_account = models.ForeignKey("MpesaAccount", on_delete=models.CASCADE, related_name='mpesa_registed_urls', null=True)
    
    response_type = models.CharField(max_length=15)

    confirmation_url = models.URLField()
    validation_url = models.URLField()

    #-------

    request_payload = JSONField(null=True)
    response_payload = JSONField(null=True)

    def __str__(self):
        return "Registered URL for %s" % self.mpesa_account.account_id

    class Meta:
        db_table = "mpesa_account_registered_url"


#--------
    

class MpesaAccount(BaseModel):
    organization = models.ForeignKey('MpesaOrganization', on_delete=models.CASCADE, null=True)

    account_type = models.PositiveSmallIntegerField(choices=AccountType.choices(), null=True)
    identifier_type = models.PositiveSmallIntegerField(choices=IdentifierType.choices())
    identifier = models.CharField(max_length=20)

    account_id = models.CharField(max_length=30, unique=True, default=generate_id)

    is_active = models.BooleanField(default=False)

    def __str__(self):
        return "MpesaAccount %s" % self.identifier

    class Meta:
        db_table = "mpesa_account"
        unique_together = ('organization', 'identifier_type', 'identifier')


class MpesaBankAccount(BaseModel):
    mpesa_account = models.ForeignKey('MpesaAccount', models.CASCADE, related_name='linked_bank_accounts')
    bank_account = models.ForeignKey('banking.BankAccount', models.CASCADE, related_name='linked_mpesa_accounts')

    class Meta:
        db_table = "mpesa_bank_account"
        unique_together = ('mpesa_account', 'bank_account')

    def __str__(self):
        return f"Mpesa Bank Account: {self.bank_account}"


class MpesaAccountBalance(BaseModel):
    request_id = models.CharField(max_length=50, null=True, blank=False)
    mpesa_account = models.ForeignKey("MpesaAccount", models.CASCADE, related_name='account_balances')

    balance_requested_at = models.DateTimeField(null=True)
    balance_updated_at = models.DateTimeField(null=True)

    PENDING = 0
    SUCCESSFUL = 1
    FAILED = 2
    STATUSES = (
        (PENDING, "Pending"),
        (SUCCESSFUL, "Successful"),
        (FAILED, "Failed"))
    status = models.PositiveIntegerField(choices=STATUSES, null=True)

    #-------

    request_payload = JSONField(null=True)
    response_payload = JSONField(null=True)

    def __str__(self):
        return "Account Balance %s" % self.mpesa_account.identifier

    class Meta:
        db_table = "mpesa_account_balance"


# -----


class MpesaTransaction(BaseModel):
    transaction_id = models.CharField(max_length=50, null=True)
    command_id = models.CharField(max_length=40, choices=CommandID.choices())

    transaction_category = models.PositiveSmallIntegerField(choices=MpesaTransactionCategory.choices(), null=True)

    mpesa_receipt_number = models.CharField(max_length=50, null=True, default=generate_id)

    sender_account = models.ForeignKey('MpesaAccount', related_name='initiated_transactions', on_delete=models.CASCADE, null=True)
    recipient_account = models.ForeignKey('MpesaAccount', related_name='receiving_transactions', on_delete=models.CASCADE, null=True)

    initiator = models.CharField(max_length=100, null=True)
    initiated_at = models.DateTimeField(null=True, editable=False)

    billref_number = models.CharField(max_length=50, null=True)
    invoice_number = models.CharField(max_length=50, null=True)

    transaction_time = models.CharField(max_length=50, null=True, editable=False)

    transaction_amount = models.DecimalField(decimal_places=2, max_digits=18, null=True)
    transaction_charge = models.DecimalField(decimal_places=2, max_digits=18, null=True)
    
    b2c_utility_balance = models.DecimalField(decimal_places=2, max_digits=18, null=True)
    b2c_working_account_balance = models.DecimalField(decimal_places=2, max_digits=18, null=True)

    result_code = models.PositiveSmallIntegerField(choices=ResultCode.choices(), null=True)

    status = models.PositiveSmallIntegerField(choices=MpesaTransactionStatus.choices(), null=True)

    # ------

    request_payload = JSONField(null=True)
    response_payload = JSONField(null=True)

    def __str__(self):
        return f"Mpesa Transaction {(self.mpesa_receipt_number or self.transaction_id)}; {self.sender_account} to {self.recipient_account}"

    class Meta:
        db_table = "mpesa_transaction"

    def as_dict(self):
        return {
            'transaction_id': self.transaction_id,
            'command_id': self.command_id,
            'transaction_id': self.transaction_id,
            'sender_account': self.sender_account.account_id,
            'recipient_account': self.recipient_account.account_id,
            'initiator': self.initiator,
            'initiated_at': self.initiated_at,
            'billref_number': self.billref_number,
            'invoice_number': self.invoice_number,
            'transaction_time': self.transaction_time.isoformat() if self.transaction_time else None,
            'transaction_amount': self.transaction_amount,
            'result_code': self.result_code,
        }
