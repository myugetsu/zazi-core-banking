from django.urls import reverse_lazy

from .default import *

SHOW_ADMIN = False

INSTALLED_APPS += [
    'zazi.apps.mpesa_proxy',
]

SITE_DOMAIN = MPESA_WEBHOOKS_URL = config('MPESA_WEBHOOKS_URL', default="", cast=str)
API_URL = MPESA_API_URL = config('MPESA_API_URL', default="", cast=str)

try:
    from .local_settings import *
except ImportError:
    pass