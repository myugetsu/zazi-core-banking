from django.conf.urls import url, include
from django.contrib import admin

from . import views

urlpatterns = [
    url(r'sms/', views.send_message, name="send-message"),
]
