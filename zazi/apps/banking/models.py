# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from decimal import Decimal as D

from django.contrib.postgres.fields import JSONField
from django.db import models
from django.template.defaultfilters import slugify

from zazi.core.json import JSONEncoder
from zazi.core.base import BaseModel
from zazi.core.utils import generate_id
from zazi.core.enums import TransactionStatus, EntryType

from .enums import BankingTransactionType, BankAccountType

#----------


class Bank(BaseModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(null=True, editable=False)

    logo = models.FileField(upload_to="bank/logos", blank=True, null=True)

    class Meta:
        db_table = "bank"

    def save(self, *args, **kwargs):
        if self.pk is None:
            self.slug = slugify(self.name)
            super(Bank, self).save(*args, **kwargs)

    def __str__(self):
        return self.name


class BankAccount(BaseModel):
    name = models.CharField(max_length=100, null=True)

    bank_account_id = models.CharField(max_length=25, default=generate_id)
    bank = models.ForeignKey('Bank', models.CASCADE)

    current_balance = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    balance_items = JSONField(encoder=JSONEncoder, null=True)

    gl_ledger_account = models.ForeignKey('general_ledger.GLAccount', models.SET_NULL, null=True)
    bank_account_type = models.PositiveSmallIntegerField(choices=BankAccountType.choices(), null=True)

    class Meta:
        db_table = "bank_account"

    def __str__(self):
        return self.name or str(self.bank)

    def as_dict(self):
        return dict(
            name=self.name,
            bank_account_id=self.bank_account_id,
            bank_name=self.bank.name,
            bank_slug=self.bank.slug,
            bank_logo=self.bank.logo.url if self.bank.logo else None,
            balance=self.current_balance,
            balance_items=self.balance_items,
            bank_account_type=BankAccountType(self.bank_account_type).get_text())


#----------


class BankingTransaction(BaseModel):
    bank_account = models.ForeignKey('BankAccount', models.CASCADE)

    transaction_type = models.PositiveSmallIntegerField(choices=BankingTransactionType.choices())
    amount = models.DecimalField(max_digits=18, decimal_places=4)

    status = models.PositiveSmallIntegerField(choices=TransactionStatus.choices())

    class Meta:
        db_table = "bank_transaction"


class BankingTransactionEntry(BaseModel):
    banking_transaction = models.ForeignKey('BankingTransaction', models.CASCADE)
    bank_account = models.ForeignKey('BankAccount', models.CASCADE)

    entry_type = models.PositiveSmallIntegerField(choices=EntryType.choices())
    amount = models.DecimalField(max_digits=18, decimal_places=4, default=D('0.0'))

    class Meta:
        db_table = "bank_transaction_entry"