from django.contrib import admin

from .models import \
    LoanTransactionEntry, LoanLedgerAccountingLink, LoanLedgerBalance, \
    LoanLedgerAccount,\
    LoanFundSource, LoanFundSourceEntry, OwnersCapitalEntry

admin.site.register(LoanLedgerAccount)
admin.site.register(LoanLedgerBalance)
admin.site.register(LoanLedgerAccountingLink)
admin.site.register(LoanFundSource)
admin.site.register(LoanFundSourceEntry)
admin.site.register(OwnersCapitalEntry)

class LoanTransactionEntryAdmin(admin.ModelAdmin):
    list_filter = ['entry_type', 'ledger_account']

admin.site.register(LoanTransactionEntry, LoanTransactionEntryAdmin)