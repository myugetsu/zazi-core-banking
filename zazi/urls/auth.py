from django.apps import apps
from django.conf.urls import url

from django.conf import settings
from django.contrib.auth import views as auth_views
from django.contrib import admin

from zazi.core.django_admin import setup_admin_sites


def get_auth_urls():
    class LoginView(auth_views.LoginView):
        template_name = 'auth/login/all.html'

    return [
        url(r'^login/$', LoginView.as_view(), name='login'),
        url(r'^logout/$', auth_views.LogoutView.as_view(), name="logout"),
    ]

def get_admin_urls(obfuscated=False, using=None, admin_path=None):
    admin_path = 'admin'

    User = apps.get_model('auth', 'User')
    
    class UserInline(admin.TabularInline):
        model = User

    return setup_admin_sites(admin_path)
