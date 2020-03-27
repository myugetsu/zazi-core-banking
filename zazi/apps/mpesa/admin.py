# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin

from .models import (
    MpesaOrganization,
    MpesaAPIAccount,
    LipaNaMpesaAccount,
    MpesaAccount,
    MpesaAccountRegisteredURL,
    MpesaAccountBalance,
    MpesaBankAccount,
    MpesaTransaction)

for M in (
    MpesaOrganization,
    MpesaAPIAccount,
    MpesaBankAccount,
    LipaNaMpesaAccount,
    MpesaAccount,
    MpesaAccountRegisteredURL,
    MpesaAccountBalance,
    MpesaTransaction
):
    admin.site.register(M)