# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import logging

from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.views.decorators.http import require_POST

from zazi.core.json import JsonResponse
from zazi.apps.users.decorators import protected_resource

from .. import utils as mpesa, forms
from ..decorators import is_mpesa_user, user_passes_test

logger = logging.getLogger(__name__)


@require_POST
@protected_resource
def authenticate(request, organization_id=None):
    try:
        form = forms.AuthenticationForm(request.POST)
        if form.is_valid():
            short_code = form.cleaned_data['short_code']

            response = {
                "authentication_token": mpesa.request_authentication(
                    request.user, 
                    organization_id, 
                    short_code),
            }
            status = 200
    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)
        response = {
            "message": "Please complete system setup first",
            "success": False
        }
        status = 404
    except Exception as e:
        logger.exception(e)
        response = {
            "message": "Internal Error",
            "success": False
        }
        status = 500

    return JsonResponse(response, status=status)


@require_POST
@protected_resource
def b2b_transact(request):
    form = forms.B2BForm(request.POST)

    if form.is_valid():
        b2b_account_sender_short_code = form.cleaned_data['sender_short_code']
        b2b_account_receiver_short_code = form.cleaned_data['receiver_short_code']
        amount = form.cleaned_data['amount']
        
        response = mpesa.request_b2b_transaction(
            b2b_account_sender_short_code, 
            b2b_account_receiver_short_code,
            amount,
            request.user)
    else:
        response = form.errors

    return JsonResponse(response)


@require_POST
@protected_resource
def c2b_register_urls(request, organization_id):

    try:
        form = forms.C2BForm(request.POST)
        
        if form.is_valid():
            short_code = form.cleaned_data['short_code']
            validation_url = form.cleaned_data['validation_url']
            confirmation_url = form.cleaned_data['confirmation_url']

            mpesa_registered_url = mpesa.request_c2b_register_urls(
                organization_id,
                short_code, 
                validation_url=validation_url, 
                confirmation_url=confirmation_url)
            
            response = {
                "success": True,
                "mpesa_registered_url": mpesa_registered_url.reference
            }
            status = 200
        else:
            status = 400
            response = {
                "errors": dict(form.errors.items()),
                "success": False
            }
    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)
        response = {
            "message": "Please complete system setup first",
            "success": False
        }
        status = 404
    except Exception as e:
        logger.exception(e)
        response = {
            "message": "Internal Error",
            "success": False
        }
        status = 500

    return JsonResponse(response, status=status)


@require_POST
@protected_resource
def b2c_transact(request, organization_id=None):
    try:

        form = forms.B2CForm(request.POST)

        if form.is_valid():
            sender_short_code = form.cleaned_data['short_code']
            receiver_phone_number = form.cleaned_data['phone_number']
            amount = form.cleaned_data['amount']
            notes = form.cleaned_data['notes']

            transaction = mpesa.request_b2c_transaction(
                organization_id,
                sender_short_code,
                receiver_phone_number,
                amount,
                request.user,
                remarks=notes)

            response = {
                'success': True,
                'message': 'B2C Transaction successful',
                'transaction_id': transaction.transaction_id
            }
            
            status = 200
        else:
            response = {
                "errors": dict(form.errors.items()),
                "success": False
            }
            status = 400

    except ObjectDoesNotExist as e:
        logger.exception(e)
        response = {
            "message": "Please complete system setup first",
            "success": False
        }
        status = 404
    except Exception as e:
        logger.exception(e)

        response = {
            "message": "Internal Error",
            "success": False
        }
        status = 500

    return JsonResponse(response, status=status)


@require_POST
@protected_resource
def check_balance(request):
    try:
        form = forms.B2CForm(request.POST)

        if form.is_valid():
            short_code = form.cleaned_data['short_code']
            comment = form.cleaned_data['comment']

            transaction = mpesa.request_check_balance(
                short_code, 
                request.user, 
                remarks=comment)
            response = {
                'success': True,
                'message': 'B2C Transaction successful',
                'transaction_id': transaction.transaction_id
            }
            
            status = 200
        else:
            response = {
                "errors": dict(form.errors.items()),
                "success": False
            }
            status = 400

    except ObjectDoesNotExist as e:
        logger.exception(e)

        response = {
            "message": "Please complete system setup first",
            "success": False
        }
        status = 404
    except Exception as e:
        logger.exception(e)
        
        response = {
            "message": "Internal Error",
            "success": False
        }
        status = 500

    return JsonResponse(response, status=status)


@require_POST
@protected_resource
def transaction_reverse(request):
    form = forms.B2CForm(request.POST)

    if form.is_valid():
        transaction_id = form.cleaned_data['transaction_id']
        comment = form.cleaned_data['comment']
        occassion = form.cleaned_data['occassion']
        
        response = mpesa.request_transaction_reverse(
            transaction_id,
            remarks=comment,
            occassion=occassion)
        status = 200
    else:
        response = {
            "errors": dict(form.errors.items()),
            "success": False
        }
        status = 400

    return JsonResponse(response, status=status)


@require_POST
@protected_resource
def check_transaction_status(request):
    form = forms.CheckTransactionStatusForm(request.POST)

    if form.is_valid():
        transaction_id = form.cleaned_data['transaction_id']
        notes = form.cleaned_data['notes']
        mpesa_user = request.user.mpesa_user

        response = mpesa.request_check_transaction_status(
            transaction_id, 
            mpesa_user,
            remarks=notes)
        status = 200
    else:
        response = {
            "errors": dict(form.errors.items()),
            "success": False
        }
        status = 400

    return JsonResponse(response, status=status)


@require_POST
@protected_resource
def mpesa_express_stk_push(request, organization_id):
    form = forms.B2CForm(request.POST)

    if form.is_valid():
        transaction = mpesa.request_mpesa_express_stk_push(
            organization_id, 
            form.cleaned_data['short_code'], 
            form.cleaned_data['phone_number'], 
            form.cleaned_data['amount'])
        response = {
            'success': True,
            'transaction': transaction.as_dict()
        }
    else:
        response = {
            "errors": dict(form.errors.items()),
            "success": False
        }

    return JsonResponse(response, status=200)


@require_POST
@protected_resource
def mpesa_express_query(request):
    return mpesa.request_mpesa_express_query(

    )