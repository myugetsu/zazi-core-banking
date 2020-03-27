from .development import *

DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'zazi',
        'USER': 'zazi',
        'PASSWORD': 'zazi',
    }
}

SITE_DOMAIN = 'localhost:8000'
