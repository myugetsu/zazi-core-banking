from django.contrib import admin

from .models import \
    LoanAccount, LoanProduct, LoanTransaction, LoanProfile,\
    LoanApplication, LoanAccountBalance

admin.site.register(LoanApplication)
admin.site.register(LoanProduct)
admin.site.register(LoanAccountBalance)
admin.site.register(LoanProfile)
admin.site.register(LoanAccount)
admin.site.register(LoanTransaction)