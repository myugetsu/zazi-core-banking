from django.utils import timezone

from http import HTTPStatus

from zazi.core import json

from .models import Token

def protected_resource(view):
    def test_func(request):
        try:
            token = request.headers.get('Authorization', '').split('Token ')[1]
        except IndexError:
            token = None
        
        if token is not None:
            if Token.objects.check_token(token):
                token = Token.objects\
                    .filter(access=token, expires__gt=timezone.now())\
                    .last()
                request.user = token.user
                request.is_authenticated = True
                return True

        return False

    def wrapped_view(request, *args, **kwargs):
        if test_func(request):
            if request.user.is_authenticated:
                return view(request, *args, **kwargs)
            else:
                return json.JsonResponse({
                    "success": "False",
                    "message": "Authentication failed; Invalid token."
                }, status=HTTPStatus.FORBIDDEN.value)    
        else:
            return json.JsonResponse({
                "success": "False",
                "message": "Authentication failed; Invalid token."
            }, status=HTTPStatus.FORBIDDEN.value)
    
    return wrapped_view
