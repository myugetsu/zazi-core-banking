from django.conf.urls import url, include

from .backend import urlpatterns

urlpatterns = [
    url(r'', include(('zazi.apps.android.urls', 'android'), namespace='android'))
] + urlpatterns
