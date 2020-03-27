from django import forms

class FundLoanBookForm(forms.Form):
    amount = forms.DecimalField(required=True, min_value=0, max_value=1000000)
    transaction_fee = forms.DecimalField(required=False, min_value=0, max_value=100000)

    notes = forms.CharField(max_length=200)