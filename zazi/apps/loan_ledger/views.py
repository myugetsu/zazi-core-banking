import logging

from http import HTTPStatus

from decimal import Decimal as D

from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django.db import transaction as db_transaction
from django.http import Http404

from django.shortcuts import redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET

from zazi.apps.users.decorators import protected_resource

from zazi.core.json import JsonResponse

from zazi.core import json

from .forms import FundLoanBookForm
from .utils import api


@protected_resource
@require_GET
@csrf_exempt
def loan_dashboard_data(request):
    with db_transaction.atomic():
        data = api.get_loan_dashboard_data()

    return json.JsonResponse({
        **data
    })
    

def loan_current_balance(request):
    return json.JsonResponse({

    })
    

@csrf_exempt
@protected_resource
@require_POST
def fund_loan_book(request):
    response = {}

    data = json.loads(request.body)
    form = FundLoanBookForm(data=data)

    if form.is_valid():
        balance = api.fund_loan_book(**data)

        if balance:
            response['success'] = True
            response['data'] = dict(
                balance_id=balance.entry_id,
                balance_as_at=balance.balance_as_at)

        else:
            response['success'] = False
            response['message'] = "Could not complete transaction"

    else:
        response['success'] = False
        response['errors'] = dict(form.errors.items())

    return json.JsonResponse(response)