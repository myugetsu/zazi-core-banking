import os
import sys

from decimal import Decimal as D

import dj_database_url
from django.urls import reverse_lazy
from django.utils.log import DEFAULT_LOGGING
from decouple import config

import logging.config

from zazi.core import json

from unipath import Path

# ----------------

APPEND_SLASH = True

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1").split(",")

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = Path(os.path.abspath(__file__)).parent.parent

SITE_DOMAIN = config("SITE_DOMAIN", "localhost")

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='ka334349qw0wqjkdssksd3232..30dzo2=\dsl/--21318jxoa[mz\'\";a%y;@y8qlu')

# SECURITY WARNING: don't run with debug turned on in production!
TEMPLATE_DEBUG = DEBUG = config("DEBUG", default=False, cast=bool)

# Application definition
#Order if simportant for django
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.humanize',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'bootstrap4'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = config('ROOT_URLCONF', default='zazi.urls.backend')

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [
        BASE_DIR.child("templates")
    ],
    'APP_DIRS': True,
    'OPTIONS': {
        'debug': False,
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ]
    }
}]

WSGI_APPLICATION = 'zazi.wsgi.application'

# Password validation
# https://docs.djangoproject.com/en/1.10/ref/settings/#auth-password-validators

from django.contrib.auth.password_validation import MinimumLengthValidator
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.SHA1PasswordHasher',
    'django.contrib.auth.hashers.MD5PasswordHasher',
    'django.contrib.auth.hashers.UnsaltedSHA1PasswordHasher',
    'django.contrib.auth.hashers.UnsaltedMD5PasswordHasher',
    'django.contrib.auth.hashers.CryptPasswordHasher',
]


AUTH_USER_MODEL = 'auth.User'

# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Africa/Nairobi'

USE_I18N = True
USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/
STATIC_URL = config("MEDIA_URL", default='/static/')
STATICFILES_DIRS = (BASE_DIR.child("static"), )
STATIC_ROOT = Path(config("STATIC_ROOT", default=Path(BASE_DIR, "static_root")))

MEDIA_URL = config("MEDIA_URL", default='/media/')
MEDIA_ROOT = Path(config("MEDIA_ROOT", default=Path(BASE_DIR, "media")))

DEFAULT_DATE_INPUT_FORMATS = (
    '%d-%m-%Y', '%d-%m-%y', '%d/%b/%Y', '%Y-%m-%d', '%d/%m/%Y', '%d/%m/%y',  # '2006-10-25', '25/10/2006', '25/10/06'
)
DEFAULT_DATETIME_INPUT_FORMATS = (
    '%Y-%m-%d',              # '2006-10-25'
    '%d-%m-%Y',              # '25-10-2006'
    '%d-%m-%y',
    '%d-%b-%Y',
    '%d/%b/%Y',
    '%d/%m/%Y',              # '25/10/2006'
    '%d/%m/%y',              # '25/10/06'
    '%Y-%m-%d %H:%M:%S',     # '2006-10-25 14:30:59'
    '%Y-%m-%d %H:%M',        # '2006-10-25 14:30'
    '%d-%b-%Y %H:%M',
    '%d-%b-%Y %H:%M:%S',
    '%d/%b/%Y %H:%M',
    '%d/%b/%Y %H:%M:%S',
    '%d/%m/%Y %H:%M:%S',     # '25/10/2006 14:30:59'
    '%d/%m/%Y %H:%M',        # '25/10/2006 14:30'
    '%d/%m/%y %H:%M:%S',     # '25/10/06 14:30:59'
    '%d/%m/%y %H:%M',        # '25/10/06 14:30'
)

# Disable Django's logging setup
LOGGING_CONFIG = None
LOGLEVEL = config('LOGLEVEL', default='info', cast=str.upper)

logging.config.dictConfig({
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue'
        },
        'info_filter': {
            '()': 'django.utils.log.CallbackFilter',
            'callback': lambda record: record.levelname == "INFO"
        },
        'debug_filter': {
            '()': 'django.utils.log.CallbackFilter',
            'callback': lambda record: record.levelname == "DEBUG"
        }
    },
    'formatters': {
        'default': {
            # exact format is not important, this is the minimum information
            'format': '%(asctime)s %(name)-12s %(levelname)-8s %(message)s',
        },
        'django.server': DEFAULT_LOGGING['formatters']['django.server'],
        'json_formatter': {
            'format': json.dumps({
                "name": "%(name)-12s", 
                "level": "%(levelname)-8s", 
                "time": "%(asctime)s", 
                "level_name": "%(levelname)s", 
                "module": "%(module)s", 
                "date": "%(asctime)s", 
                "data": "%(message)s", 
                "line_no": "%(lineno)d", 
                "path": "%(pathname)s"
            }),
            'class': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'datefmt': "%Y-%m-%d %H:%M:%S",
        },
        'main_formatter': {
            'format': '%(levelname)s:%(name)s: %(message)s '
                      '(%(asctime)s; %(filename)s:%(lineno)d)',
            'datefmt': "%Y-%m-%d %H:%M:%S",
        },
    },
    'handlers': {
        'django.server': DEFAULT_LOGGING['handlers']['django.server'],
        # console logs to stderr
        'console': {
            'level': 'DEBUG',
            'filters': ['require_debug_true'],
            'class': 'logging.StreamHandler',
            'formatter': 'main_formatter',
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        },
        'null': {
            "class": 'logging.NullHandler',
        },
        'production_file': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'json_formatter',
            'filters': ['require_debug_false'],
        },
        'debug_file': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'main_formatter',
            'filters': ['debug_filter'],
        },
    },
    'loggers': {
        # Our application code
        'app': {
            'level': LOGLEVEL,
            'handlers': ['console', 'production_file', 'debug_file'],
            # Avoid double logging because of root logger
            'propagate': False,
        },

        # Default runserver request logging
        'django': {
            'handlers': ['null'],
        },
        'django.request': {
            'handlers': ['mail_admins', 'console'],
            'level': 'ERROR',
            'propagate': True,
        },
        'django.server': DEFAULT_LOGGING['loggers']['django.server'],
        # Django finish

        'django.utils.autoreload': {
            'level': "INFO",
            'handlers': ['null', ],
        },

        'py.warnings': {
            'handlers': ['null', ],
        },
        # default for all undefined Python modules

        '': {
            'handlers': ['console', 'production_file', 'debug_file'],
            'level': "DEBUG",
        },
    },
})
