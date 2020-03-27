from africastalking.AfricasTalkingGateway import \
    AfricasTalkingGateway, AfricasTalkingGatewayException

from django.shortcuts import get_object_or_404, render

from .models import SMSGateway, SMSMessage

def index(request):
    return render(request, "sms/index.html")
