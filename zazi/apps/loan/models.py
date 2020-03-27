import logging

from collections import OrderedDict, defaultdict
from decimal import Decimal as D

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from django.db import models
from django.utils import timezone

from zazi.core import rounding, time as timing
from zazi.core.base import BaseModel
from zazi.core.utils import generate_id

from .enums import \
    LoanStatus, LoanTransactionType, LoanProductType, \
    PaymentPlatform, LoanInterestMethod, LoanTransactionStatus, \
    LoanInterestRateAccrualSchedule, LoanAllocationItem, LoanProfileStatus

#----------------

logger = logging.getLogger(__name__)

#----------------


class LoanProduct(BaseModel):
    name = models.CharField(max_length=25)
    product_id = models.CharField(max_length=25, default=generate_id, null=True)

    payment_platform = models.PositiveSmallIntegerField(choices=PaymentPlatform.choices())
    product_type = models.PositiveSmallIntegerField(choices=LoanProductType.choices())
    
    max_loan_limit = models.DecimalField(max_digits=18, decimal_places=4, default=0)

    # Interest
    interest_method = models.PositiveSmallIntegerField(choices=LoanInterestMethod.choices())
    
    interest_rate = models.PositiveSmallIntegerField(default=0)
    interest_rate_accrual_schedule = models.PositiveSmallIntegerField(choices=LoanInterestRateAccrualSchedule.choices())

    @property
    def allocation_order(self):
        return [
            LoanAllocationItem.LIABILITY,
            LoanAllocationItem.PENALTY,
            LoanAllocationItem.FEES,
            LoanAllocationItem.INTEREST,
            LoanAllocationItem.PRINCIPAL ]


#----------------


class LoanProfile(BaseModel):
    profile_id = models.CharField(max_length=25, default=generate_id)

    effective_loan_limit = models.DecimalField(max_digits=18, decimal_places=4, default=0)

    user_account = models.ForeignKey('users.UserAccount', models.SET_NULL, null=True, related_name='loan_profile')

    # risk_classification = models.PositiveSmallIntegerField(choices=LoanRiskClassification.choices())

    status = models.PositiveSmallIntegerField(choices=LoanProfileStatus.choices())

    def __str__(self):
        return f"LoanProfile {self.profile_id} for user {self.user_account.user.username}"

    def as_dict(self):
        try:
            identity = self.user_account.identities.get()
        except ObjectDoesNotExist as e:
            logger.exception(e)
            
            identity = None
        except MultipleObjectsReturned as e:
            logger.exception(e)

            identity = self.user_account.identities.first()

        
        return {
            'profile_id': self.profile_id, 
            'user_account': self.user_account.as_dict(),
            'identity': (identity and identity.as_dict()),
            'loan_limit': self.loan_limit,
            'loan_accounts': [
                l.as_dict() 
                for l in self.loan_accounts.filter(status=LoanStatus.ACTIVE)
            ]
        }

    @property
    def loan_limit(self):
        return self.effective_loan_limit

    @property
    def outstanding_balance(self):
        return sum(
            loan_account.outstanding_balance 
                for loan_account in self.loan_accounts.all())


class LoanApplication(BaseModel):
    application_id = models.CharField(max_length=25, default=generate_id)

    loan_profile = models.ForeignKey('LoanProfile', models.SET_NULL, null=True)

    payment_platform = models.PositiveSmallIntegerField(choices=PaymentPlatform.choices())
    amount = models.DecimalField(decimal_places=2, max_digits=7)

    applied_at = models.DateTimeField()

    approved = models.NullBooleanField()
    approved_at = models.DateTimeField(null=True)
    approved_by = models.ForeignKey('users.UserAccount', models.SET_NULL, null=True)

    def as_dict(self):
        return OrderedDict(
            application_id=self.application_id,
            loan_profile=self.loan_profile.profile_id if self.loan_profile_id else None,
            payment_platform=self.payment_platform,
            amount=self.amount,
            applied_at=self.applied_at,
            approved=self.approved,
            approved_at=self.approved_at,
            approved_by=self.approved_by.account_id if self.approved_by_id else None)


#----------------


class LoanAccount(BaseModel):
    account_id = models.CharField(max_length=25, default=generate_id)
    product = models.ForeignKey('LoanProduct', models.SET_NULL, null=True)

    #----------------

    loan_profile = models.ForeignKey('LoanProfile', models.SET_NULL, null=True, related_name='loan_accounts')
 
    #----------------

    amount_disbursed = models.DecimalField(max_digits=18, decimal_places=4, default=D('0.0'), blank=True)
    date_disbursed = models.DateTimeField(null=True, blank=True)

    #----------------

    last_repayment_date = models.DateTimeField(null=True, blank=True)
    last_interest_accrual_date = models.DateTimeField(null=True, blank=True)
    last_balance_update_date = models.DateTimeField(null=True)

    status = models.PositiveSmallIntegerField(choices=LoanStatus.choices(), default=LoanStatus.PENDING_DISBURSEMENT)
    is_active = models.BooleanField(default=False)

    def __str__(self):
        return "Loan Account: %s" % self.account_id

    @property
    def outstanding_balance(self):
        try:
            return self\
                .current_balance\
                .outstanding_balance
        except AttributeError:
            return D('0.0')

    @property
    def current_balance(self):
        try:
            return self\
                .account_balances\
                .filter(is_current=True)\
                .get()
        except ObjectDoesNotExist as e:
            logger.exception(e)

            return None
        except MultipleObjectsReturned as e:
            logger.exception(e)

            self.account_balances\
                .filter(is_current=True)\
                .update(is_current=False)

            latest = self\
                .account_balances\
                .latest('balance_as_at')
            latest.is_current = True
            latest.save()
                
            return latest


    def get_repayment_items(self):
        return {
            LoanAllocationItem.LIABILITY: self.current_balance.liability_balance,
            LoanAllocationItem.PRINCIPAL: self.current_balance.principal_balance,
            LoanAllocationItem.PENALTY: self.current_balance.penalties_balance,
            LoanAllocationItem.FEES: self.current_balance.fees_balance,
            LoanAllocationItem.INTEREST: self.current_balance.interest_balance }

    def reset_account_balances(self, save=False):
        self.last_repayment_date = None
        self.last_interest_accrual_date = None

        if save:
            self.save()

    @property
    def disbursed_less_than_90_days_ago(self):
        """
        """
        return timing._90_days_ago() < self.date_disbursed 

    @property
    def disbursed_less_than_60_days_ago(self):
        """
        """
        return timing._60_days_ago() < self.date_disbursed 

    @property
    def disbursed_less_than_30_days_ago(self):
        """
        """
        return timing._30_days_ago() < self.date_disbursed 

    @property
    def disbursed_more_than_90_days_ago(self):
        """
        """
        return timing._90_days_ago() > self.date_disbursed 

    @property
    def disbursed_more_than_60_days_ago(self):
        """
        """
        return timing._60_days_ago() > self.date_disbursed

    @property
    def disbursed_more_than_30_days_ago(self):
        """
        """
        return timing._30_days_ago() > self.date_disbursed 

    def has_cleared_balance(self):
        return self.outstanding_balance <= D('0.0')

    #---------------

    def pay_off_account(self, save=False):
        # make entries to the ledger
        if self.has_cleared_balance:
            self.status = LoanStatus.PAID_OFF
            self.last_repayment_date = timezone.now()

            if save:
                self.save()

    #---------------

    def as_dict(self):
        current_balance = self.current_balance
        
        _dict = dict(
            account_id=self.account_id,
            loan_limit=self.loan_profile.loan_limit,
            date_disbursed=self.date_disbursed,
            status=self.status,
            is_active=self.is_active)

        try:
            _dict.update(current_balance=current_balance.as_dict())
        except AttributeError as e:
            logger.exception(e)
        
        return _dict


class LoanTransaction(BaseModel):
    transaction_id = models.CharField(max_length=30, unique=True, default=generate_id)
    transaction_type = models.PositiveSmallIntegerField(choices=LoanTransactionType.choices(), null=True)

    loan_account = models.ForeignKey('LoanAccount', models.CASCADE, null=True, related_name='loan_transactions')
    
    amount = models.DecimalField(decimal_places=2, max_digits=7, default=D('0.0'))
    
    initiated_at = models.DateTimeField(null=True)
    processed_at = models.DateTimeField(null=True)
    posted_at = models.DateTimeField(null=True)

    status = models.PositiveSmallIntegerField(choices=LoanTransactionStatus.choices(), null=True)

    def __str__(self):
        return f"LoanTransaction: {LoanTransactionType(self.transaction_type).get_text()} of {self.amount} on account {self.loan_account}"


class LoanAccountBalance(BaseModel):
    entry_id = models.CharField(max_length=25, default=generate_id)
    loan_account = models.ForeignKey('LoanAccount', models.CASCADE, related_name='account_balances')

    previous_balance = models.ForeignKey('self', models.SET_NULL, null=True)

    principal_paid_bf = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    interest_paid_bf = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    fees_paid_bf = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    penalties_paid_bf = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    principal_due_bf = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    interest_accrued_bf = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    fees_accrued_bf = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    penalties_accrued_bf = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    liability_credit_balance_bf = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    liability_debit_balance_bf = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)

    principal_paid = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    interest_paid = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    fees_paid = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    penalties_paid = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    principal_due = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    interest_accrued = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    fees_accrued = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    penalties_accrued = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    liability_credit_balance = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)
    liability_debit_balance = models.DecimalField(max_digits=18, decimal_places=2, default=D('0.0'), blank=True)

    balance_as_at = models.DateTimeField(null=True)
    is_current = models.NullBooleanField(null=True)

    class Meta:
        db_table = 'loan_account_balance'

    def __str__(self):
        return f"Loan Account Balance for {self.loan_account} as at {self.balance_as_at} UTC"

    @property
    def outstanding_balance(self):
        outstanding_loan_balance = (
            (self.principal_balance + self.fees_balance) +
            self.interest_balance +
            self.penalties_balance 
        )

        return outstanding_loan_balance

    @property
    def principal_balance(self):
        principal_balance = (
            (self.principal_due_bf + self.principal_due) - 
            (self.principal_paid_bf + self.principal_paid))
        
        return principal_balance - self.liability_balance

    @property
    def fees_balance(self):
        return (
            (self.fees_accrued_bf + self.fees_accrued) - 
            (self.fees_paid_bf + self.fees_paid))

    @property
    def interest_balance(self):
        return (
            (self.interest_accrued_bf + self.interest_accrued) - 
            (self.interest_paid_bf + self.interest_paid))

    @property
    def penalties_balance(self):
        return (
            (self.penalties_accrued_bf + self.penalties_accrued) - 
            (self.penalties_paid_bf + self.penalties_paid))

    @property
    def liability_balance(self):
        return (
            (self.liability_credit_balance_bf + self.liability_credit_balance) + 
            (self.liability_debit_balance_bf + self.liability_debit_balance))

    def as_dict(self):
        return OrderedDict(
            entry_id=self.entry_id,
            loan_account=self.loan_account.account_id,
            previous_balance=self.previous_balance.entry_id if self.previous_balance_id else None,
            outstanding_balance=self.outstanding_balance,
            liability_balance=self.liability_balance,
            principal_paid=(self.principal_paid_bf + self.principal_paid),
            interest_paid=(self.interest_paid_bf + self.interest_paid),
            fees_paid=(self.fees_paid_bf + self.fees_paid),
            penalties_paid=(self.penalties_paid_bf + self.penalties_paid),
            principal_due=(self.principal_due_bf + self.principal_due),
            interest_accrued=(self.interest_accrued_bf + self.interest_accrued),
            fees_accrued=(self.fees_accrued_bf + self.fees_accrued),
            penalties_accrued=(self.penalties_accrued_bf + self.penalties_accrued),
            balance_as_at=timezone.localtime(self.balance_as_at))