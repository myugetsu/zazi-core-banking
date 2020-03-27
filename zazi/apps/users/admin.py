from django.contrib import admin

from  .models import Authentication, UserInvitation, UserAccount, Token

admin.site.register(Authentication)
admin.site.register(UserInvitation)
admin.site.register(UserAccount)
admin.site.register(Token)
