# -*- coding: utf-8 -*-
from __future__ import unicode_literals


import logging

from django.db import transaction as db_transaction
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404

from django.shortcuts import render, get_object_or_404

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from zazi.core import json
from zazi.core.json import JsonResponse

from ..models import MpesaTransaction, MpesaAPIAccount, MpesaAccount, MpesaOrganization

from .. import utils as mpesa, enums, forms

#------------

logger = logging.getLogger(__name__)

#------------


def process_request(request, processor, *args, **kwargs):
    logger.info("Processing request: %s" % processor)

    try:
        data = json.loads(request.body)
        logger.debug(data)

        result_code = processor(data, *args, **kwargs)
        if result_code == enums.ResultCode.success:
            logger.debug("Result processed successfully")
            response = {
                "ResultCode": enums.ResultCode.success,
                "ResultDesc": "Accepted"
            }
        else:
            logger.debug(f"Result not processed successfully {result_code}")
            response = {
                "ResultCode": result_code,
                "ResultDesc": "Rejected"
            }
        
        status = 200
    except Exception as e:
        logger.exception("Error processing request")

        status = 500
        response = {
            "ResultCode": enums.ResultCode.internal_failure,
            "ResultDesc": "Rejected"
        }

    logger.info("Finished processing request: %s" % processor)

    return JsonResponse(response, status=status)


# ------------

@csrf_exempt
@require_POST
def c2b_stk_push_callback_url(request, organization_id=None, reference=None):
    try:
        return process_request(
            request, 
            mpesa.process_c2b_mpesa_express_response,
            organization_id=organization_id,
            reference=reference)

    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)

        status = 404
        response = {
            "message": "Item not found",
            "success": False
        }
    except Exception as e:
        logger.exception(e)

        response = {
            "message": "Internal error",
            "success": False
        }
        status = 400
        
    return JsonResponse(response, status=status)


# ------------


@csrf_exempt
@require_POST
def c2b_validation_url(request, organization_id=None, reference=None):
    try:
        logger.debug(request.body)
        data = json.loads(request.body)
        logger.debug(data)

        form = forms.APIC2BForm(data)
        status = 200

        if form.is_valid():
            return process_request(
                request, 
                mpesa.process_c2b_validation_request,
                organization_id=organization_id,
                reference=reference)
        else:
            status = 400
            response = {
                "message": "Error in values passed",
                "success": False,
                "errors": form.errors
            }
    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)

        status = 404
        response = {
            "message": "Item not found",
            "success": False
        }
    except Exception as e:
        logger.exception(e)

        response = {
            "message": "Internal error",
            "success": False
        }
        status = 400
        
    return JsonResponse(response, status=status)


@csrf_exempt
@require_POST
def c2b_confirmation_url(request, organization_id=None, reference=None):
    try:
        logger.debug(request.body)
        data = json.loads(request.body)
        logger.debug(data)

        form = forms.APIC2BForm(data)
        status = 200

        if form.is_valid():
            return process_request(
                request, 
                mpesa.process_c2b_confirmation_request,
                organization_id=organization_id,
                reference=reference)
        else:
            status = 400
            response = {
                "message": "Error in values passed",
                "success": False,
                "errors": form.errors
            }
    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)

        status = 404
        response = {
            "message": "Item not found",
            "success": False
        }
    except Exception as e:
        logger.exception(e)

        response = {
            "message": "Internal error",
            "success": False
        }
        status = 400
        
    return JsonResponse(response, status=status)


# ------------


@csrf_exempt
@require_POST
def balance_check_result_url(request, organization_id=None, reference=None):
    try:
        with db_transaction.atomic():
            mpesa_transaction = get_object_or_404(
                MpesaTransaction.objects\
                    .filter(
                        command_id=enums.CommandID.UTILITY_ACCOUNT_BALANCE,
                        sender_account__organization__organization_id=organization_id,
                        transaction_id=reference,
                        response_payload__isnull=True))

            return process_request(
                request, 
                mpesa.process_balance_check_result,
                mpesa_transaction=mpesa_transaction)
    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)

        status = 404
        response = {
            "message": "Item not found",
            "success": False
        }
    except Exception as e:
        logger.exception(e)

        response = {
            "message": "Internal error",
            "success": False
        }
        status = 400

    return JsonResponse(response, status=status)


@csrf_exempt
def reversal_result_url(request, organization_id=None, reference=None):
    try:
        with db_transaction.atomic():
            mpesa_transaction = get_object_or_404(
                MpesaTransaction.objects.filter(
                    command_id=enums.CommandID.UTILITY_TRANSACTION_REVERSAL,
                    sender_account__organization__organization_id=organization_id,
                    transaction_id=reference,
                    transaction_time__isnull=True,
                    transaction_amount__isnull=True,
                    response_payload__isnull=True))

            return process_request(
                request, 
                mpesa.process_reversal_result, 
                mpesa_transaction=mpesa_transaction)
    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)

        status = 404
        response = {
            "message": "Item not found",
            "success": False
        }
    except Exception as e:
        logger.exception(e)

        response = {
            "message": "Internal error",
            "success": False
        }
        status = 400

    return JsonResponse(response, status=status)


@csrf_exempt
@require_POST
def b2c_result_url(request, organization_id=None, reference=None):
    logger.info("Processing B2C Request result for %s transaction id %s" % (organization_id, reference))

    try:
        with db_transaction.atomic():
            _qs = MpesaTransaction.objects.filter(
                command_id=enums.CommandID.B2C_BUSINESS_PAYMENT,
                sender_account__organization__organization_id=organization_id)
            _qs = _qs.filter(
                transaction_id=reference,
                transaction_time__isnull=True)
            _qs = _qs.filter(
                transaction_amount__isnull=True,
                response_payload__isnull=True)

            mpesa_transaction = get_object_or_404(_qs)

            logger.info("mpesa transaction %s found, and processed" % mpesa_transaction.transaction_id)

            return process_request(
                request, 
                mpesa.process_b2c_result,
                mpesa_transaction=mpesa_transaction)

    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)

        status = 404
        response = {
            "message": "Item not found",
            "success": False
        }
    except Exception as e:
        logger.exception(e)
        response = {
            "message": "Internal error",
            "success": False
        }
        status = 400

    return JsonResponse(response, status=status)


#---------------


@csrf_exempt
@require_POST
def balance_check_queue_timeout_url(request, organization_id=None, reference=None):
    try:
        with db_transaction.atomic():
            mpesa_transaction = get_object_or_404(
                MpesaTransaction.objects.filter(
                    command_id=enums.CommandID.UTILITY_ACCOUNT_BALANCE,
                    sender_account__organization__organization_id=organization_id,
                    transaction_id=reference,
                    transaction_time__isnull=True,
                    transaction_amount__isnull=True,
                    response_payload__isnull=True))

            logger.debug(request.body)
            data = json.loads(request.body)
            logger.debug(data)
            
            mpesa_transaction.response_payload = data

            mpesa_transaction.save()
            
            response = {
                "message": "Received successfully.",
                "success": True
            }
            status = 200
    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)

        status = 404
        response = {
            "message": "Item not found",
            "success": False
        }
    except Exception as e:
        logger.exception(e)

        response = {
            "message": "Internal error",
            "success": False
        }
        status = 400

    return JsonResponse(response, status=status)


@csrf_exempt
@require_POST
def b2c_queue_timeout_url(request, organization_id=None, reference=None):
    try:
        with db_transaction.atomic():
            logger.debug(request.body)
            data = json.loads(request.body)
            logger.debug(data)

            mpesa_transaction = get_object_or_404(
                MpesaTransaction.objects.filter(
                    sender_account__organization__organization_id=organization_id,
                    command_id=enums.CommandID.B2C_BUSINESS_PAYMENT,
                    transaction_id=reference,
                    transaction_time__isnull=True,
                    transaction_amount__isnull=True,
                    response_payload__isnull=True))
            mpesa_transaction.response_payload = data
            mpesa_transaction.save()    
            
            response = {
                "message": "Message received successfully.",
                "success": True
            }
            status = 200
    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)

        status = 404
        response = {
            "message": "Item not found",
            "success": False
        }
    except Exception as e:
        logger.exception(e)

        response = {
            "message": "Internal error",
            "success": False
        }
        status = 400

    return JsonResponse(response, status=status)


@csrf_exempt
def reversal_queue_timeout_url(request, organization_id=None, reference=None):
    try:
        with db_transaction.atomic():
            logger.debug(request.body)
            data = json.loads(request.body)
            logger.debug(data)

            mpesa_transaction = get_object_or_404(
                MpesaTransaction.objects.filter(
                    command_id=enums.CommandID.UTILITY_TRANSACTION_REVERSAL,
                    sender_account__organization__organization_id=organization_id,
                    transaction_id=reference,
                    transaction_time__isnull=True,
                    transaction_amount__isnull=True,
                    response_payload__isnull=True))
            mpesa_transaction.response_payload = data
            mpesa_transaction.save()    
            
            response = {
                "message": "Message received successfully.",
                "success": True
            }
            status = 200
    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)

        status = 404
        response = {
            "message": "Item not found",
            "success": False
        }
    except Exception as e:
        logger.exception(e)

        response = {
            "message": "Internal error",
            "success": False
        }
        status = 400

    return JsonResponse(response, status=status)