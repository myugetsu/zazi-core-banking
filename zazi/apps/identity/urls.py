from django.conf.urls import url, include
from django.urls import reverse

from . import views

urlpatterns = [
    url(r'^identity/verify/$', views.verify_identity, name='verify_identity'),
]