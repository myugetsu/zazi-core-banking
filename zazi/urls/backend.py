import re

from django.conf import settings
from django.conf.urls import url, include
from django.conf.urls.static import static as django_static

from django.contrib.auth.decorators import login_required

from django.views.static import serve

from . import auth

urlpatterns = []
urlpatterns += django_static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += [
    url(r'^api/v1/', include(('zazi.apps.banking.urls', 'banking'), namespace='banking')), 
    url(r'^api/v1/', include(('zazi.apps.identity.urls', 'identity'), namespace='identity')), 
    url(r'^api/v1/', include(('zazi.apps.loan.urls', 'loans'), namespace='loans')), 
    url(r'^api/v1/', include(('zazi.apps.mpesa.urls', 'mpesa'), namespace='mpesa')), 
    url(r'^api/v1/', include(('zazi.apps.users.urls', 'users'), namespace='users')),
    url(r'^api/v1/', include(('zazi.apps.loan_ledger.urls', 'loan_ledger'), namespace='loan_ledger')), 
]

if settings.SHOW_ADMIN:
    from django.contrib import admin
    
    urlpatterns += [
        url(r'^admin/', admin.site.urls)]
