from .default import *

DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL'), conn_max_age=600)
}

SHOW_ADMIN = True

INVITATION_EXPIRY_PERIOD = 14

#-----------

CSRF_COOKIE_SECURE = False
CSRF_FAILURE_VIEW = 'zazi.core.csrf.csrf_failure'
CSRF_TRUSTED_ORIGINS = []

if config("CSRF_TRUSTED_ORIGINS", default=None):
    CSRF_TRUSTED_ORIGINS = config("CSRF_TRUSTED_ORIGINS").split(',')
    
EMAIL_HOST = config('EMAIL_HOST', default='smtp.mailgun.org')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)

EMAIL_HOST_USER = config('EMAIL_HOST_USER', default=None)
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default=None)

EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)

#-----------

MIDDLEWARE += [
    'django.middleware.csrf.CsrfViewMiddleware'
]

INSTALLED_APPS = (['django.contrib.admin'] + INSTALLED_APPS)
INSTALLED_APPS += [
    'storages',

    'zazi.apps.identity',
    'zazi.apps.users',
    'zazi.apps.sms',

    'zazi.apps.general_ledger',
    'zazi.apps.banking',

    'zazi.apps.loan',
    'zazi.apps.loan_ledger',

    'zazi.apps.mpesa',
    'zazi.apps.mpesa_loan',

]

#-----------

HARD_LOAN_LIMIT = config('HARD_LOAN_LIMIT', 100, cast=D)
ENCRYPT_PASSWORD_SERVICE = config('ENCRYPT_PASSWORD_SERVICE', None)
MPESA_B2C_FEE = config('MPESA_B2C_FEE', 30)

# -----------

AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME", "zazi-assets")

AWS_STATIC_LOCATION = config('AWS_STATIC_LOCATION', 'static')
STATICFILES_STORAGE = config("STATICFILES_STORAGE", "zazi.core.storage_backends.StaticStorage")

AWS_S3_CUSTOM_DOMAIN = config("AWS_S3_CUSTOM_DOMAIN", f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com')
STATIC_URL = config("STATIC_URL", f"https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_STATIC_LOCATION}/")

#---------------

AWS_PUBLIC_MEDIA_LOCATION = config("AWS_PRIVATE_MEDIA_LOCATION", 'media/public')
DEFAULT_FILE_STORAGE = config("DEFAULT_FILE_STORAGE", 'zazi.core.storage_backends.DefaultMediaStorage')

AWS_PRIVATE_MEDIA_LOCATION = config("AWS_PRIVATE_MEDIA_LOCATION", 'media/private')
PRIVATE_FILE_STORAGE = config("PRIVATE_FILE_STORAGE", 'zazi.core.storage_backends.DefaultMediaStorage')

#---------------

AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', None)
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', None)
AWS_REGION = config('AWS_REGION', 'us-east-1')

#---------------

ENCRYPTION_INVOKER_ACCESS_KEY_ID = config('ENCRYPTION_INVOKER_ACCESS_KEY_ID', None)
ENCRYPTION_INVOKER_SECRET_ACCESS_KEY = config('ENCRYPTION_INVOKER_SECRET_ACCESS_KEY', None)

MPESA_REQUESTS_TIMEOUT_SECONDS = config('MPESA_REQUESTS_TIMEOUT_SECONDS', default=10, cast=int)

MPESA_WEBHOOKS_URL = config('MPESA_WEBHOOKS_URL', default="", cast=str)
MPESA_API_URL = config('MPESA_API_URL', default="", cast=str)