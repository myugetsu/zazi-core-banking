from django.contrib import admin

# Register your models here.
from .models import SMSGateway, SMSMessage

@admin.register(SMSGateway)
class SMSGatewayAdmin(admin.ModelAdmin):
    list_display = ('__str__', )
    fieldsets = (
        (None, {'fields': ('name', )}),
        ('Configurations', {'fields': ('default', 'service_provider', 'api_key', 'api_secret',)}),
        ('Other', {'fields': ('short_code', 'sender_id', 'is_sandbox',)})
    )

@admin.register(SMSMessage)
class SMSMessageAdmin(admin.ModelAdmin):
    list_display = ('__str__', )
    fieldsets = (
        ('Config', {'fields': ('sms_gateway', 'message_type' )}),
        ('Message Details', {'fields': ('message', 'sender_id', 'recipient_id', 'message_id',)}),
        ('Other', {'fields': ('status', 'delivered',)})
    )