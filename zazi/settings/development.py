from .production import *

DEBUG = True

ROOT_URLCONF = 'zazi.urls.backend'

STATIC_URL = config("MEDIA_URL", default='/static/')
STATICFILES_DIRS = (BASE_DIR.child("static"), )
STATIC_ROOT = Path(config("STATIC_ROOT", default=Path(BASE_DIR, "static_root")))

try:
    from .local_settings import *
except ImportError:
    pass