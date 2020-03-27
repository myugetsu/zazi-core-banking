from django.db import models

from zazi.core.utils import generate_id
from zazi.core.base import BaseModel


class MpesaLoanProduct(BaseModel):
    mpesa_api_account = models.ForeignKey(
        'mpesa.MpesaAPIAccount', 
        models.CASCADE, 
        related_name='loan_products')

    loan_product = models.ForeignKey('loan.LoanProduct', models.CASCADE, related_name='mpesa_products')

    is_active = models.BooleanField(default=False)


# -------------


class MpesaLoanAccount(BaseModel):
    loan_account = models.ForeignKey('loan.LoanAccount', models.CASCADE, related_name='mpesa_accounts')
    mpesa_account = models.ForeignKey(
        'mpesa.MpesaAccount', 
        models.CASCADE,
        related_name='loan_accounts')

    is_active = models.BooleanField(default=False)

    class Meta:
        unique_together = ('loan_account', 'mpesa_account')


# -------------


class MpesaLoanTransaction(BaseModel):
    loan_transaction = models.ForeignKey(
        'loan.LoanTransaction', models.CASCADE, related_name='mpesa_transactions')
    mpesa_transaction = models.ForeignKey(
        'mpesa.MpesaTransaction', models.CASCADE, null=True, related_name='loan_transactions')

