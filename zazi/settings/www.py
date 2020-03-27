from django.urls import reverse_lazy

from .default import *

#-----------

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.humanize',
    'django.contrib.messages',
    'django.contrib.staticfiles'
]

ROOT_URLCONF = config('ROOT_URLCONF', default='zazi.urls.www')