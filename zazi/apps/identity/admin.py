from django.contrib import admin

from .models import Identity, MpesaIdentityVerification

admin.site.register(Identity)
admin.site.register(MpesaIdentityVerification)