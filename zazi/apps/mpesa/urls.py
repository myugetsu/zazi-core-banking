from django.conf.urls import url, include
from django.urls import reverse

from . import views

urlpatterns = [
    url(r'^organization/create/$', views.create_organization, name='create_organization'),
    url(r'^organization/(?P<organization_id>[a-zA-Z0-9]{9,24})/accounts/personal/create/$', 
        views.create_personal_account, name='create_personal_account'),

    # -----------

    url(r'^(?P<organization_id>[a-zA-Z0-9]{9,24})/mpesa/authenticate/$', views.authenticate, name='mpesa_api_authenticate'),

    url(r'^(?P<organization_id>[a-zA-Z0-9]{9,24})/mpesa/c2b/push/$', views.mpesa_express_stk_push, name='mpesa_express_c2b_push'),
    url(r'^(?P<organization_id>[a-zA-Z0-9]{9,24})/mpesa/c2b/query/$', views.mpesa_express_query, name='mpesa_express_c2b_query'),

    url(r'^(?P<organization_id>[a-zA-Z0-9]{9,24})/mpesa/c2b/register-url/$', views.c2b_register_urls, name='mpesa_c2b_register_urls'),
    
    url(r'^(?P<organization_id>[a-zA-Z0-9]{9,24})/mpesa/b2c/transact/$', views.b2c_transact, name='mpesa_b2c_transact'),
    url(r'^(?P<organization_id>[a-zA-Z0-9]{9,24})/mpesa/b2b/transact/$', views.b2b_transact, name='mpesa_b2b_transact'),

    url(r'^(?P<organization_id>[a-zA-Z0-9]{9,24})/mpesa/check-balance/$', views.check_balance, name='mpesa_check_balance'),
    url(r'^(?P<organization_id>[a-zA-Z0-9]{9,24})/mpesa/reverse/$', views.transaction_reverse, name='mpesa_reversal'),
    url(r'^(?P<organization_id>[a-zA-Z0-9]{9,24})/mpesa/check-status/$', views.check_transaction_status)


]

# ------------------

wehbook_urlpatterns = [
    url(r'^w/(?P<organization_id>[a-zA-Z0-9]{9,24})/m/(?P<reference>[a-zA-Z0-9]{9,24})/cbv/?$', views.c2b_validation_url, name='mpesa_c2b_validation_url'),
    url(r'^w/(?P<organization_id>[a-zA-Z0-9]{9,24})/m/(?P<reference>[a-zA-Z0-9]{9,24})/cbc/?$', views.c2b_confirmation_url, name='mpesa_c2b_confirmation_url'),
    url(r'^w/(?P<organization_id>[a-zA-Z0-9]{9,24})/m/(?P<reference>[a-zA-Z0-9]{9,24})/cbs/?$', views.c2b_stk_push_callback_url, name='mpesa_c2b_stk_push_callback_url'),

    url(r'^w/(?P<organization_id>[a-zA-Z0-9]{9,24})/m/(?P<reference>[a-zA-Z0-9]{9,24})/br/?$', views.balance_check_result_url, name='mpesa_balance_check_result_url'),
    url(r'^w/(?P<organization_id>[a-zA-Z0-9]{9,24})/m/(?P<reference>[a-zA-Z0-9]{9,24})/be/?$', views.balance_check_queue_timeout_url, name='mpesa_balance_check_queue_timeout_url'),

    url(r'^w/(?P<organization_id>[a-zA-Z0-9]{9,24})/m/(?P<reference>[a-zA-Z0-9]{9,24})/rr/?$', views.reversal_result_url, name='mpesa_reversal_result_url'),
    url(r'^w/(?P<organization_id>[a-zA-Z0-9]{9,24})/m/(?P<reference>[a-zA-Z0-9]{9,24})/re/?$', views.reversal_queue_timeout_url, name='mpesa_reversal_queue_timeout_url'),

    url(r'^w/(?P<organization_id>[a-zA-Z0-9]{9,24})/m/(?P<reference>[a-zA-Z0-9]{9,24})/bcr/?$', views.b2c_result_url, name='mpesa_b2c_result_url'),
    url(r'^w/(?P<organization_id>[a-zA-Z0-9]{9,24})/m/(?P<reference>[a-zA-Z0-9]{9,24})/bce/?$', views.b2c_queue_timeout_url, name='mpesa_b2c_queue_timeout_url')
]

# ------------------

urlpatterns += wehbook_urlpatterns