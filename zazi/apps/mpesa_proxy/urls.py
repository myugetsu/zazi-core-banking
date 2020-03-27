from django.conf.urls import url, include
from django.urls import reverse

from . import views

urlpatterns = [
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