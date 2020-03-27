# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from django.db import transaction as db_transaction

from ..models import MpesaOrganization, MpesaAccount
from .. import forms, enums
from ..decorators import user_passes_test

from zazi.apps.mpesa import utils as mpesa
from zazi.core.json import JsonResponse
from zazi.apps.users.decorators import protected_resource


@require_POST
@protected_resource
def create_organization(request):
    form = forms.OrganizationForm(request.POST)

    if form.is_valid():
        with db_transaction.atomic():
            organization = form.save()

            response = {
                "organization_id": organization.organization_id,
                "success": True
            }
            status = 200
    else:
        response = {
            "errors": form.errors,
            "success": False
        }
        status = 400

    return JsonResponse(response, status=status)

@require_POST
@protected_resource
def create_personal_account(request, organization_id=None):
    form = forms.PersonalAccountForm(request.POST)

    if form.is_valid():
        try:
            data = form.cleaned_data
            personal_mpesa_account = mpesa.create_personal_account(
                organization_id, 
                data['phone_number'])

            response = {
                "mpesa_account_id": personal_mpesa_account.account_id,
                "success": True
            }
            status = 200
        except Http404:
            status = 404

            response = {
                "success": False,
                "message": "Error creating account"
            }
    else:
        response = {
            "errors": form.errors,
            "success": False
        }
        status = 400

    return JsonResponse(response, status=status)
