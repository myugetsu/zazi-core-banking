from django.conf.urls import url, include
from django.urls import reverse

from . import views

urlpatterns = [
    url(r'^banking/bank_accounts/balance/update/$', views.check_bank_account_balances, name='check_bank_account_balances'),
]