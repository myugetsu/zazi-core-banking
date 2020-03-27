# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin

from .models import GLAccount, GLPeriodClosure, GLTransactionEntry

admin.site.register(GLAccount)
admin.site.register(GLPeriodClosure)
admin.site.register(GLTransactionEntry)
