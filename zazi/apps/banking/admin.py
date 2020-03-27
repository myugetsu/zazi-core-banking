# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin

from .models import BankAccount, Bank

admin.site.register(Bank)
admin.site.register(BankAccount)