from django.conf.urls import url, include
from django.urls import reverse

from . import views

urlpatterns = [
    url(r'^loan/profile/$', views.loan_profile, name='loan_profile'),
    url(r'^loan/accounts/$', views.loan_accounts, name='loan_accounts_list'),
    
    url(r'^loan/(?P<loan_account_id>[a-zA-Z0-9]{8,30})/status/$', views.loan_status, name='loan_status'),
    url(r'^loan/(?P<loan_account_id>[a-zA-Z0-9]{8,30})/repayment/$', views.loan_repayment, name='loan_repayment'),

    url(r'^loan/(?P<loan_profile_id>[a-zA-Z0-9]{8,30})/limit/$', views.loan_limit, name='loan_limit'),
    url(r'^loan/(?P<loan_profile_id>[a-zA-Z0-9]{8,30})/application/$', views.loan_application, name='loan_application')
]