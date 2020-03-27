import re

from django.conf import settings
from django.conf.urls import url
from django.conf.urls.static import static as django_static
from django.shortcuts import render

#-------------

urlpatterns = []
urlpatterns += django_static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

#-------------

def index(request):
    return render(request, "www/index.html", {})

def terms_of_service(request):
    return render(request, "www/terms.html", {})

def privacy_policy(request):
    return render(request, "www/privacy.html", {})

#-------------

urlpatterns += [
    url(r'^$', index),
    url(r'^terms-of-service/$', terms_of_service),
    url(r'^privacy-policy/$', privacy_policy),
]