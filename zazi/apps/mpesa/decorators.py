from django.contrib.auth.decorators import user_passes_test
from django.core.exceptions import ObjectDoesNotExist

from django.contrib.auth.decorators import login_required, user_passes_test
from django.conf import settings

def get_decorator(test_func):
    def decorator(function=None, redirect_field_name=None, login_url=None):
        """
        Decorator for views that checks that the user is logged in, redirecting
        to the log-in page if necessary.
        """
        actual_decorator = user_passes_test(
            test_func,
            login_url=login_url,
            redirect_field_name=redirect_field_name
        )
        if function:
            return actual_decorator(function)
        return actual_decorator
    return decorator

def is_mpesa_user(user):
    try:
        user.mpesa_user
    except ObjectDoesNotExist:
        return False
    return True
