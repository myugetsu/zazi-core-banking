import re

from django.conf.urls import url, include

# -------------

urlpatterns = [
    url(r'^api/v1/', include('zazi.apps.mpesa_proxy.urls')),
]