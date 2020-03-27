import logging

from http import HTTPStatus

from decimal import Decimal as D

from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import Http404

from django.shortcuts import redirect, get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET

from zazi.apps.users.decorators import protected_resource

from zazi.core.json import JsonResponse, loads

from . import enums, utils as api

# ------------

logger = logging.getLogger(__name__)

# ------------

@require_POST
@csrf_exempt
@protected_resource
def verify_identity(request):
    response = {}
    
    try:
        if api.request_mpesa_verification(request.user):
            response['success'] = True
    except Exception as e:
        logger.exception(e)

    return JsonResponse(response)