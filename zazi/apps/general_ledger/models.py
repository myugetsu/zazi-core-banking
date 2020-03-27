# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

from decimal import Decimal as D

from zazi.core.base import BaseModel
from zazi.core.utils import generate_id

ACCOUNT_TYPES = (
    (1, "Asset"),
    (2, "Liability"),
    (3, "Equity/Capital"),
    (4, "Revenue/Income"),
    (5, "Expense"))
class GLAccount(BaseModel):
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=50, unique=True)

    account_type = models.PositiveIntegerField(choices=ACCOUNT_TYPES)

    class Meta:
        db_table = 'gl_account'
        ordering = ['code']

    def __str__(self):
        return f"{self.code}: {self.name}"


class GLPeriodClosure(BaseModel):
    previous_period = models.ForeignKey('self', models.SET_NULL, null=True)

    closure_id = models.CharField(max_length=25, default=generate_id)

    period_start = models.DateTimeField(null=True)
    period_end   = models.DateTimeField()

    class Meta:
        db_table = 'gl_period_closure'

ENTRY_TYPES = (
    (0, "DEBIT"),
    (1, "CREDIT"))
class GLTransactionEntry(BaseModel):
    closure_group = models.ForeignKey('GLPeriodClosure', models.SET_NULL, null=True, related_name='transaction_entries')

    entry_id = models.CharField(max_length=25, default=generate_id)
    entry_type = models.PositiveSmallIntegerField(choices=ENTRY_TYPES, null=True)

    gl_account = models.ForeignKey('GLAccount', models.CASCADE, null=True)
    
    balance_bf = models.DecimalField(max_digits=18, decimal_places=4, default=D('0.0'))
    balance = models.DecimalField(max_digits=18, decimal_places=4, default=D('0.0'))

    entry_date = models.DateTimeField(null=True)

    class Meta:
        db_table = 'gl_transaction_entry'