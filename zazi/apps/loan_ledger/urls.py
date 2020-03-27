from django.conf.urls import url, include
from django.urls import reverse

from . import views

urlpatterns = [
    url(r'^loan/ledger/analytics.json/?$', views.loan_dashboard_data, name='loan_dashboard_data'),
    url(r'^loan/ledger/fund/?$', views.fund_loan_book, name='fund_loan_book'),
    
    url(r'^loan/ledger/(?P<loan_account_id>[a-zA-Z0-9]{8,30})/balance/current/$', views.loan_current_balance, name='loan_current_balance'),
]