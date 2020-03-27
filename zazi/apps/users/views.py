import datetime
import logging

from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django.contrib import messages 
from django.contrib.auth import authenticate, login, get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib.auth.decorators import login_required
from django.db import transaction as db_transaction
from django.shortcuts import redirect, get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt

from zazi.apps.identity.utils import identity_is_verified

from zazi.core.json import JsonResponse

from . import utils as api, forms
from .decorators import protected_resource
from .models import Authentication, ResetPINCode

logger = logging.getLogger(__name__)

from django.conf import settings


#----------------

User = get_user_model()

#----------------


@csrf_exempt
def authenticate_user(request):

    @require_POST
    def action(request):
        if request.user.is_authenticated:
            response = {
                'success': False,
                'message': 'Already authenticated bruh!'
            }
            status = 302
        else:
            form = forms.LoginForm(request.POST)

            if not form.is_valid():
                response = {
                    'success': False,
                    'errors': dict(form.errors.items()),
                    'message': 'Error registering the user.'
                }
                status = 402
            else:
                token = form.generate_token()

                response = {
                    'success': True,
                    'token': {
                        'user_account_id': token.user.user_account.account_id,
                        'access': token.access,
                        'refresh': token.refresh,
                        'expires': 3600
                    }
                }
                status = 200

        return JsonResponse(response, status=status)
    
    return action(request)


@csrf_exempt
def invite_member(request):
    
    @require_POST
    @protected_resource
    def action(request):
        response = {}

        try:
            form = forms.InviteMemberForm(request.POST, request.user)
            status = 200

            if form.is_valid():
                phone_number_invited = form.cleaned_data['phone_number']

                try:
                    invitation = api.get_pending_invitation(
                        request.user, 
                        phone_number_invited)
                    logger.debug("And invitation exists to this user")
                    
                    is_verified = False
                except ObjectDoesNotExist:
                    logger.debug("Not invitation exists to this user")

                    #1. Check if the phone number is already the system and verified
                    is_verified = identity_is_verified(phone_number_invited)
                    
                    #2. Create a connection if the user is verified or not
                    invitation = api.create_member_invitation(
                        request.user, 
                        phone_number_invited, 
                        is_verified=is_verified)

                #3. update the response
                response.update(
                    success=True,
                    message='Member Invited successfully',
                    invitation=dict(
                        phone_number=phone_number_invited,
                        invitee_is_verified=is_verified,
                        invitation_id=invitation.invitation_id,
                        invited_by=invitation.invited_by.account_id,
                        invitation_code=invitation.invitation_code,
                        expires_at=invitation.expires_at))
            else:
                logger.debug(form.errors)
                response.update(
                    success=False,
                    message="Error inviting member. The phone number is invalid or Connection already exists.",
                    errors=dict(form.errors.items()))

        except ObjectDoesNotExist as e:
            logger.exception(e)

            response = {
                'success': False,
                'message': 'User not found.'
            }
            status = 404
        except Exception as e:
            logger.exception(e)

            response = {
                'success': False,
                'message': 'Error fetching data'
            }
            status = 502

        return JsonResponse(response, status=status)

    return action(request)


@csrf_exempt
def invitee_validate(request):

    @require_POST
    def action(request):
        if request.user.is_authenticated:
            response = {
                'success': False,
                'message': 'Already registered bruh!'
            }
            
            status = 302
        else:
            form = forms.VerifyInviteeForm(request.POST)

            if not form.is_valid():
                response = {
                    'success': False,
                    'errors': dict(form.errors.items()),
                    'message': 'Error registering the user.'
                }
                status = 402
            else:
                response = {
                    'success': True,
                    'message': 'Validation successful.'
                }
                status = 200

        return JsonResponse(response, status=status)

    return action(request)


@csrf_exempt
def invitee_user_create(request):
    
    @require_POST
    def action(request):
        if request.user.is_authenticated:
            response = {
                'success': False,
                'message': 'Already registered bruh!'
            }
            status = 302
        else:
            form = forms.VerifyInviteeForm(request.POST)
            
            if not form.is_valid():
                response = {
                    'success': False,
                    'errors': dict(form.errors.items()),
                    'message': 'Validation failed.'
                }
                status = 402
            else:
                phone_number = form.cleaned_data['phone_number']
                invitation_code = form.cleaned_data['invitation_code']
                device_code = form.cleaned_data.get('device_code')
                
                try:
                    logger.info(f"Attempting to register user '{phone_number}' on device {device_code}")
                    user = api.create_end_user(phone_number, invitation_code)
                    
                    if user:
                        logger.info(f"Successfully registered user '{phone_number}' on device {device_code}")
                        response = {
                            'success': True,
                            'message': 'You have successfully registered to Tujisort.',
                            'user': {
                                'id': user.id,
                                'username': user.username,
                                'first_name': user.first_name,
                                'last_name': user.last_name,
                                'email': user.email,
                                'is_staff': user.is_staff,
                                'is_active': user.is_active,
                                'date_joined': user.date_joined,
                            },
                            'user_account': {
                                'account_id': user.user_account.account_id,
                                'user_type': user.user_account.user_type,
                                'status': user.user_account.status
                            } if hasattr(user, 'user_account') else None
                        }
                        status = 200
                    else:
                        response = {
                            'success': False,
                            'message': 'User was not created.'
                        }
                        status = 200
                except Exception as e:
                    logger.exception(e)
                    
                    response = {
                        'success': False,
                        'message': 'Error encountered creating user.'
                    }
                    status = 402

        return JsonResponse(response, status=status)

    return action(request)


def phone_number_verification(request):
    response = {}

    if request.method == "POST":
        pass
    else:
        pass

    return JsonResponse(response)


@csrf_exempt
def reset_security_pin(request, pin_reset_id=None):
    
    @require_POST
    def action(request):
        response = { 'success': False }

        try:
            reset_pin_code = api.get_reset_pin_code(pin_reset_id)
        except ResetPINCode.DoesNotExist:
            status = 404
            response['message'] = 'Reset PIN expired or invalid'
        else:
            form = forms.ResetPINForm(request.POST, request.user)
            
            if form.is_valid():
                with db_transaction.atomic():
                    pin = form.cleaned_data['pin']
                    
                    try:
                        response['success'] = api.reset_pin(reset_pin_code, pin)
                        status = 200
                    except Exception as e:
                        logger.exception(e)

                        status = 500
                        response['success'] = False
                        response['message'] = 'Error setting PIN.'

            else:
                response['errors'] = form.errors
                status = 500

        return JsonResponse(response, status=status)

    return action(request)


@csrf_exempt
def request_user_pin_reset(request, user_account_id=None):

    @require_POST
    @protected_resource
    def action(request):
        response = { 'success': False }

        logger.debug(f"User is super user? = {request.user.is_superuser}")
        form = forms.RequestResetPINForm(request.POST)

        if form.is_valid():
            requestee_phone_number = form.cleaned_data['requestee_phone_number']
            reset_pin_code = api.request_user_pin_reset(
                request.user, 
                requestee_phone_number)

            response.update(
                success=True,
                reset_pin_code=reset_pin_code.as_dict())
            status = 200
            
        else:
            response['errors'] = form.errors
            status = 500

        return JsonResponse(response, status=status)

    return action(request)


@csrf_exempt
def set_security_pin(request, user_account_id):
    
    @require_POST
    def action(request):
        response = {}

        try:
            form = forms.SecureAccountForm(request.POST)

            if form.is_valid():
                pin = form.cleaned_data['pin']

                user = get_object_or_404(User, user_account__account_id=user_account_id)
                expiry_date = (timezone.now() + datetime.timedelta(days=(30*3)))

                try:
                    authentication = Authentication.objects.get(
                        user=user,
                        expires__gt=timezone.now())
                    authentication.expires_at = expiry_date
                    authentication.save()
                except Authentication.DoesNotExist as e:
                    logger.debug("No password set, creating a new password to expire in on")
                
                    Authentication.objects.create(
                        user=user,
                        security_pin=make_password(pin),
                        expires=expiry_date)

                response = {
                    'success': True,
                    'message': 'Security PIN set successfully'
                }

                status = 200
            else:
                response['errors'] = form.errors

        except ObjectDoesNotExist as e:
            logger.exception(e)

            response = {
                'success': False,
                'message': 'User not data.'
            }
            status = 404
        except Exception as e:
            logger.exception(e)

            response = {
                'success': False,
                'message': 'Error fetching data'
            }
            status = 502

        return JsonResponse(response, status=status)
    
    return action(request)

# -----------------


@csrf_exempt
def fetch_user(request, user_account_id=None):

    @protected_resource
    @require_GET
    def action(request):
        try:
            user = get_user_model()\
                .objects\
                .filter(user_account__account_id=user_account_id)\
                .select_related()\
                .get()
            user_account = user.user_account
        
            response = {
                'success': True,
                'user_account': user_account.as_dict()
            }
            status = 200
        except ObjectDoesNotExist as e:
            logger.exception(e)

            response = {
                'success': False,
                'message': 'User not found.',
            }
            status = 404
        except Exception as e:
            logger.exception(e)

            response = {
                'success': False,
                'message': 'Error fetching data'
            }
            status = 502

        return JsonResponse(response, status=status)

    return action(request)
