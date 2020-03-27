from django.conf import settings
from django.conf.urls import url, include
from django.conf.urls.static import static as django_static

urlpatterns = []

urlpatterns += django_static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

urlpatterns += [
    url(r'', include(('zazi.apps.android.urls', 'android'), namespace='android')),
]

if settings.SHOW_ADMIN:
    from django.contrib import admin
    
    urlpatterns += [
        url(r'^admin/', admin.site.urls)]