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
from . import queue

# ------------

logger = logging.getLogger(__name__)

# ------------


@protected_resource
@csrf_exempt
@require_GET
def loan_accounts(request):
    try:
        response = {
            'success': True,
            'loan_accounts': [
                loan_account.as_dict()
                for loan_account in api.get_active_loan_account(request.user)
            ]
        }

        status = 200
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


@protected_resource
@csrf_exempt
@require_GET
def loan_profile(request):
    response = {}

    try:
        response['success'] = True
        response['loan_profile'] = api.get_loan_profile(request.user).as_dict()
        status = 200
    except Exception as e:
        logger.exception(e)

        response['success'] = False
        status = 500

    return JsonResponse(response, status=status)


@csrf_exempt
@protected_resource
def loan_limit(request, loan_profile_id=None):
    try: 
        loan_profile = api.get_loan_profile(loan_profile_id=loan_profile_id)
        
        response = {
            'success': True,
            'eligible': (loan_profile.loan_limit > 0) and loan_profile.status != enums.LoanProfileStatus.BLACKLISTED,
            'loan_limit': (
                (
                    D('0.0')
                        if (loan_profile.loan_limit < D('0.0')) 
                        else loan_profile.loan_limit
                ) 
                or settings.HARD_LOAN_LIMIT
            )
        }
        status = HTTPStatus.OK
    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)
        response.update({
            "message": "Please complete system setup first",
            "success": False
        })
        status = HTTPStatus.NOT_FOUND
    except Exception as e:
        logger.exception(e)
        response.update({
            "message": "Internal Error",
            "success": False
        })
        status = HTTPStatus.INTERNAL_SERVER_ERROR

    return JsonResponse(response, status=status)


@csrf_exempt
@protected_resource
@require_POST
def loan_application(request, loan_profile_id=None):
    logger.info("Request for borrow by %s" % request.user.username)
    response = {}

    try:    
        loan_profile = api.get_loan_profile(loan_profile_id=loan_profile_id)
        
        if (
            loan_profile.loan_accounts.filter(
                status__in=(enums.LoanStatus.ACTIVE, enums.LoanStatus.DISBURSED)
            ).exists()
            or
            loan_profile.status in (
                enums.LoanProfileStatus.DEFAULT,
                enums.LoanProfileStatus.BLACKLISTED,
                enums.LoanProfileStatus.SUSPENDED
            )
        ):
            response.update({
                'loan_balance': 0,
                'success': False,
                'message': 'Loan application unsuccessful; You currently do not meet the requirements for a new Loan.'
            })
            status = HTTPStatus.PRECONDITION_REQUIRED

        elif (
            loan_profile.loan_accounts.filter(
                status__in=(
                    enums.LoanStatus.CLEAN, 
                    enums.LoanStatus.PENDING_DISBURSEMENT,
                    enums.LoanStatus.PAID_OFF
                )
            ).exists()
            and
            loan_profile.status not in (
                enums.LoanProfileStatus.DEFAULT,
                enums.LoanProfileStatus.BLACKLISTED,
                enums.LoanProfileStatus.SUSPENDED
            )
        ):
            try:
                logger.debug(f"checking request.body = {request.body}")
                data = loads(request.body)

                loan_amount = data.get('loan_amount', loan_profile.loan_limit)
                if loan_amount:
                    loan_application = queue.notify_loan_application(loan_profile, loan_amount)

                    if loan_application:
                        status = HTTPStatus.OK
                        logger.info("Request for borrow by %s successful" % request.user.username)

                        response.update({
                            'application': loan_application.as_dict(),
                            'success': True,
                            'message': 'Loan application successful; Wait for an M-Pesa confirmation or rejection notice.'
                        })
                else:
                    response.update({
                        'success': False,
                        'message': "Invalid Loan amount."
                    })
                    status = HTTPStatus.EXPECTATION_FAILED
            except Exception as e:
                logger.exception(e)

                response.update({
                    'success': False,
                    'message': "Invalid Loan state."
                })
                status = HTTPStatus.EXPECTATION_FAILED
        else:
            response.update({
                'success': False,
                'message': "Invalid Loan state."
            })
            status = HTTPStatus.EXPECTATION_FAILED

    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)
        response.update({
            "message": "Please complete system setup first",
            "success": False
        })
        status = HTTPStatus.NOT_FOUND
    except Exception as e:
        logger.exception(e)
        response.update({
            "message": "Internal Error",
            "success": False
        })
        status = HTTPStatus.INTERNAL_SERVER_ERROR
        
    return JsonResponse(response, status=status)


@csrf_exempt
@protected_resource
@require_POST
def loan_status(request, loan_account_id=None):
    loan_account = api.get_active_loan_account(request.user, loan_account_id=loan_account_id)

    response = {
        'loan_account': loan_account.account_id
    }

    if loan_account.status in (
        enums.LoanStatus.PAID_OFF, 
        enums.LoanStatus.WRITTEN_OFF,
        enums.LoanStatus.CLOSED
    ):
        response.update({
            'loan_balance': 0,
            'success': False,
            'message': "Loan repayment unsuccessful. Your loan has already been closed."
        })
        status = HTTPStatus.PRECONDITION_REQUIRED

    elif loan_account.status in (
        enums.LoanStatus.ACTIVE, 
        enums.LoanStatus.DISBURSED,
        enums.LoanStatus.IN_ARREARS
    ):
        try:
            loan_balance = loan_account.outstanding_balance

            response.update({
                'loan_balance': loan_balance,
                "success": True
            })
            status = HTTPStatus.OK
        except (ObjectDoesNotExist, Http404) as e:
            logger.exception(e)
            
            response.update({
                "message": "Please complete system setup first",
                "success": False
            })
            status = HTTPStatus.NOT_FOUND
        except Exception as e:
            logger.exception(e)
            response.update({
                "message": "Internal Error",
                "success": False
            })
            status = HTTPStatus.INTERNAL_SERVER_ERROR
    else:
        response.update({
            'success': False,
            'message': "Invalid Loan state."
        })

    return JsonResponse(response, status=status)


@csrf_exempt
@protected_resource
@require_POST
def loan_repayment(request, loan_account_id=None):
    response = {}
    
    try:
        loan_account = api\
            .get_active_loan_account(request.user, loan_account_id=loan_account_id)

        if loan_account.status in (
            enums.LoanStatus.PAID_OFF, 
            enums.LoanStatus.WRITTEN_OFF,
            enums.LoanStatus.CLOSED
        ):
            response.update({
                'loan_balance': 0,
                'success': False,
                'message': "Loan repayment unsuccessful. Your loan has already been closed."
            })
            status = HTTPStatus.PRECONDITION_REQUIRED

        elif loan_account.status in (
            enums.LoanStatus.ACTIVE, 
            enums.LoanStatus.DISBURSED,
            enums.LoanStatus.IN_ARREARS
        ):  
            logger.debug(f"checking request.body = {request.body}")
            data = loads(request.body)

            repayment_amount = D(data.get('repayment_amount') or loan_account.outstanding_balance or 0)
            loan_transaction = queue.notify_loan_repayment_request(loan_account, repayment_amount)

            response.update({
                'success': True,
                'transaction': dict(
                    transaction_id=loan_transaction.transaction_id,
                    loan_account_id=loan_transaction.loan_account.account_id,
                    amount=loan_transaction.amount
                ),
                'message': "Loan repayment request successful. Kindly input the M-Pesa password to continue"
            })
            
            status = HTTPStatus.OK
        else:
            response.update({
                'success': False,
                'message': "Loan repayment request unsuccessful. Invalid Loan state."
            })

            status = HTTPStatus.EXPECTATION_FAILED
    except (ObjectDoesNotExist, Http404) as e:
        logger.exception(e)

        response.update({
            "message": "Please complete system setup first",
            "success": False
        })
        status = HTTPStatus.NOT_FOUND
    except Exception as e:
        logger.exception(e)

        response.update({
            "message": "Internal Error",
            "success": False
        })
        status = HTTPStatus.INTERNAL_SERVER_ERROR

    return JsonResponse(response, status=status)