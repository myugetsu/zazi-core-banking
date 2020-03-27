from __future__ import unicode_literals

from django.db import models

class SMSGateway(models.Model):
    name = models.CharField(max_length=20)
    default = models.BooleanField(default=False)

    AFRICAS_TALKING = 1
    EXPRESS_SMS = 2
    SERVICE_PROVIDERS = (
        (AFRICAS_TALKING, "Africa's Talking"),
        (EXPRESS_SMS, "Express SMS"),)
    service_provider = models.IntegerField(
        choices=SERVICE_PROVIDERS, null=True, blank=False)
    
    api_key = models.CharField(
        max_length=100, help_text="For Africas' Talking, this is the username")
    api_secret = models.CharField(
        max_length=100, help_text="For Africas' Talking, this is the api key")

    is_sandbox = models.NullBooleanField()

    short_code = models.CharField(max_length=20, null=True, blank=True)
    sender_id = models.CharField(max_length=20, null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "[%s] %s" % (self.name, self.service_provider)

class SMSMessage(models.Model):
    sms_gateway = models.ForeignKey('SMSGateway', models.CASCADE)
    
    SMS_IN = 1
    SMS_OUT = 2
    MESSAGE_TYPES = (
        (SMS_IN, "SMS IN"),
        (SMS_OUT, "SMS OUT"))
    message_type = models.IntegerField(choices=MESSAGE_TYPES)
    message = models.CharField(max_length=480)

    sender_id = models.CharField(max_length=50)
    message_id = models.CharField(max_length=50, null=True)
    recipient_id = models.CharField(max_length=50)

    SUCCESS = 1
    ERROR = 2
    STATUSES = (
        (SUCCESS, "Success"),
        (ERROR, "Error"))
    status = models.IntegerField(choices=STATUSES, null=True)

    delivered = models.NullBooleanField()
    time_delivered = models.DateTimeField(null=True)

    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "[%s] %s" % (self.recipient_id, self.message)