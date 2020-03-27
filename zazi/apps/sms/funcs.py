import logging
import requests

from django.shortcuts import get_object_or_404, render
from django.db import transaction as db_transaction

from africastalking.AfricasTalkingGateway import \
    AfricasTalkingGateway, AfricasTalkingGatewayException
from .models import SMSGateway, SMSMessage

from zazi.core.utils import validate_phone_number as clean_phone_number


#--------------

logger = logging.getLogger(__name__)

#--------------


@db_transaction.atomic()
def __express_sms(gate_way, message_to, message):
    url = 'https://www.expresssms.co.ke/sms/api?'

    params = {
        "action": "send-sms",
        "api_key": gate_way.api_key,
        "to": clean_phone_number(message_to),
        "from": gate_way.sender_id,
        "sms": message,
        "response": "json",
        "unicode": 0
    }

    sms_message = SMSMessage(
        sms_gateway=gate_way,
        message_type=SMSMessage.SMS_OUT,
        message=message,
        sender_id=gate_way.sender_id,
        recipient_id=clean_phone_number(message_to),
        status=SMSMessage.SUCCESS,
        delivered=True)

    response = requests.get(url, params=params)
    response_json = response.json()
    
    if response.status_code == 200:
        if response_json["code"] == "ok":
            sms_message.status = SMSMessage.SUCCESS
            sms_message.save()
    else:
        sms_message.status = SMSMessage.ERROR
        sms_message.save()

    return [sms_message]

@db_transaction.atomic()
def __africas_talking_send_message(gate_way, message_to, message):
    gateway = AfricasTalkingGateway(
        gate_way.api_key, gate_way.api_secret)
    
    sms_messages = []

    try:
        results = gateway.sendMessage(
            clean_phone_number(message_to), 
            message, 
            gate_way.sender_id)
        
        for recipient in results:
            sms_messages.append(SMSMessage(
                sms_gateway=gate_way,
                message_type=SMSMessage.SMS_OUT,
                message=message,
                sender_id='system',
                message_id=recipient['messageId'],
                recipient_id=recipient['number'],
                status=SMSMessage.SUCCESS,
                delivered=True))

        SMSMessage.objects.bulk_create(sms_messages)

    except AfricasTalkingGatewayException as e:
        logger.exception(e)

    except Exception as e:
        logger.exception(e)

    return sms_messages

@db_transaction.atomic()
def send_message(message_to, message, gateway=None, default_gateway=SMSGateway.EXPRESS_SMS):

    try:
        gateway = SMSGateway.objects.get(default=True)
    except SMSGateway.DoesNotExist:
        gateway = SMSGateway.objects.get(service_provider=default_gateway)

    messages = __express_sms(gateway, message_to, message)

    return messages