import logging
from django.http import HttpResponseForbidden

#------------

logger = logging.getLogger(__name__)

#------------

def csrf_failure(request, reason=""):
    logger.debug(f"csrf_failure={reason}")

    return HttpResponseForbidden()