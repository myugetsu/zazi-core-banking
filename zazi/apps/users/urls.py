from django.conf.urls import url, include
from django.urls import reverse

from . import views

urlpatterns = [
    #------------- pre-authentication
    #check if the invitation code is for the said phone number/profile
    # - check in the referrals table for phone number and verification code
    # - if found and not redeemed/expired, send an sms to the phone number for app to verify user

    url(r'^users/invite/$', views.invite_member, name='invite_new_member'),

    url(r'^users/invitee/verification/$', views.invitee_validate, name='invitee_validate'),
    url(r'^users/invitee/create_user/$', views.invitee_user_create, name='create_user'),

    url(r'^users/(?P<user_account_id>[a-zA-Z0-9]{15,45})/phone/verification/$', views.phone_number_verification, name='phone_verification'),
    url(r'^users/(?P<user_account_id>[a-zA-Z0-9]{15,45})/pin/set/$', views.set_security_pin, name='set_security_pin'),
    
    url(r'^users/pin/reset/(?P<pin_reset_id>[a-zA-Z0-9]{15,45})/$', views.reset_security_pin, name='reset_security_pin'),
    url(r'^users/pin/reset/request/$', views.request_user_pin_reset, name='request_reset_security_pin'),

    #------------- authentication
    
    url(r'^users/authenticate/$', views.authenticate_user, name='user_authentication'),

    #------------- post-authentication

    url(r'^users/(?P<user_account_id>[a-zA-Z0-9]{15,45})/$', views.fetch_user, name='get_user')
]