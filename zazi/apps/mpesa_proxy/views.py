# -*- coding: utf-8 -*-

import logging

from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from zazi.core import json
from zazi.core.json import JsonResponse

from . import utils as api

# --------------

logger = logging.getLogger(__name__)

# --------------


@csrf_exempt
def c2b_stk_push_callback_url(request, organization_id=None, reference=None):

    @require_POST
    def action(request):
        try:
            logger.debug(request.body)

            data = json.loads(request.body)
            logger.debug(data)

            response = api.c2b_stk_push_callback_url(
                data,
                organization_id=organization_id,
                reference=reference)
            status = 200

        except Exception as e:
            logger.exception(e)

            response = {
                "message": "Internal error",
                "success": False
            }
            status = 400
            
        return JsonResponse(response, status=status)

    return action(request)


# ------------


@csrf_exempt
def c2b_validation_url(request, organization_id=None, reference=None):

    @require_POST
    def action(request):
        try:
            logger.debug(request.body)

            data = json.loads(request.body)
            logger.debug(data)

            response = api.c2b_validation_url(
                data,
                organization_id=organization_id,
                reference=reference)
            status = 200
        except Exception as e:
            logger.exception(e)

            response = {
                "message": "Internal error",
                "success": False
            }
            status = 400
            
        return JsonResponse(response, status=status)

    return action(request)

@csrf_exempt
def c2b_confirmation_url(request, organization_id=None, reference=None):

    @require_POST
    def action(request):
        try:
            logger.debug(request.body)

            data = json.loads(request.body)
            logger.debug(data)

            response = api.c2b_confirmation_url(
                data,
                organization_id=organization_id,
                reference=reference)
            status = 200

        except Exception as e:
            logger.exception(e)

            response = {
                "message": "Internal error",
                "success": False
            }
            status = 400
            
        return JsonResponse(response, status=status)

    return action(request)


# ------------


@csrf_exempt
def balance_check_result_url(request, organization_id=None, reference=None):

    @require_POST
    def action(request):
        try:
            logger.debug(request.body)

            data = json.loads(request.body)
            logger.debug(data)

            response = api.balance_check_result_url(
                data,
                organization_id=organization_id,
                reference=reference)
            status = 200
        except Exception as e:
            logger.exception(e)

            response = {
                "message": "Internal error",
                "success": False
            }
            status = 400

        return JsonResponse(response, status=status)

    return action(request)


@csrf_exempt
def reversal_result_url(request, organization_id=None, reference=None):

    @require_POST
    def action(request):
        try:
            logger.debug(request.body)

            data = json.loads(request.body)
            logger.debug(data)

            response = api.reversal_result_url(
                data,
                organization_id=organization_id, 
                reference=reference)
            status = 200
        except Exception as e:
            logger.exception(e)

            response = {
                "message": "Internal error",
                "success": False
            }
            status = 400

        return JsonResponse(response, status=status)

    return action(request)


@csrf_exempt
def b2c_result_url(request, organization_id=None, reference=None):

    @require_POST
    def action(request):
        logger.info("Processing B2C Request result for %s transaction id %s" % (organization_id, reference))

        try:
            logger.debug(request.body)

            data = json.loads(request.body)
            logger.debug(data)

            response = api.b2c_result_url(
                data,
                organization_id=organization_id,
                reference=reference)
            status = 200

        except Exception as e:
            logger.exception(e)
            response = {
                "message": "Internal error",
                "success": False
            }
            status = 400

        return JsonResponse(response, status=status)

    return action(request)

#---------------


@csrf_exempt
def balance_check_queue_timeout_url(request, organization_id=None, reference=None):

    @require_POST
    def action(request):
        try:
            logger.debug(request.body)

            data = json.loads(request.body)
            logger.debug(data)

            response = api.balance_check_queue_timeout_url(
                data,
                organization_id=organization_id,
                reference=reference)
            status = 200
        except Exception as e:
            logger.exception(e)

            response = {
                "message": "Internal error",
                "success": False
            }
            status = 400

        return JsonResponse(response, status=status)

    return action(request)


@csrf_exempt
def b2c_queue_timeout_url(request, organization_id=None, reference=None):

    @require_POST
    def action(request):
        try:
            logger.debug(request.body)

            data = json.loads(request.body)
            logger.debug(data)

            response = api.b2c_queue_timeout_url(
                data,
                organization_id=organization_id,
                reference=reference)
            status = 200
        except Exception as e:
            logger.exception(e)

            response = {
                "message": "Internal error",
                "success": False
            }
            status = 400

        return JsonResponse(response, status=status)

    return action(request)


@csrf_exempt
def reversal_queue_timeout_url(request, organization_id=None, reference=None):

    @require_POST
    def action(request):
        try:
            logger.debug(request.body)

            data = json.loads(request.body)
            logger.debug(data)

            response = api.reversal_queue_timeout_url(
                data,
                organization_id=organization_id,
                reference=reference)
            status = 200
        except Exception as e:
            logger.exception(e)

            response = {
                "message": "Internal error",
                "success": False
            }
            status = 400

        return JsonResponse(response, status=status)

    return action(request)