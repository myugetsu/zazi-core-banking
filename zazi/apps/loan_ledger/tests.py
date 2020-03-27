import datetime
import freezegun
import logging
import random
import string

from decimal import Decimal as D

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from zazi.apps.banking.models import BankAccount
from zazi.apps.loan.models import (
    LoanTransaction, LoanAccount, 
    LoanTransactionType, LoanTransactionStatus,
    LoanProduct, LoanAccountBalance, LoanStatus)

from zazi.apps.mpesa.models import (
    MpesaOrganization, MpesaAccount, AccountType, IdentifierType,
    UserType, MpesaAPIAccount, LipaNaMpesaAccount)
from zazi.apps.mpesa_loan.utils import create_mpesa_loan_account

from zazi.apps.identity.models import IdentityStatus
from zazi.apps.users.models import UserAccount
from zazi.apps.users.utils import create_end_user, create_member_invitation

from zazi.core import time as core_time, rounding, safaricom

from .models import (
    EntryType,
    LoanTransactionEntry,
    LoanLedgerAccountingLink,
    LoanLedgerAccount,
    LoanFundSource,
    LoanLedgerBalance)
from .utils import api, disbursal, balances, financial_statements, repayment, liability

#---------------

logger = logging.getLogger(__name__)

#---------------

DEFAULT_PIN = '5555'
NO_OF_TEST_USERS = 1

class LoanLedgerBalanceTestCase(TestCase):
    fixtures = [
        'users',
        'test_data'
    ]

    def setUp(self):
        self.maxDiff = None
        self.user = get_user_model()\
            .objects\
            .create_user(username="254703255755", password=DEFAULT_PIN, email="test.user1@gmail.com")

        self.user_account = UserAccount.objects.create(user=self.user)
        create_mpesa_loan_account(self.user.username, self.user_account)

        identity = self.user_account.identities.get()
        identity.status = IdentityStatus.VERIFIED
        identity.save()
        
        b0 = BankAccount.objects.all()[0]
        b1 = BankAccount.objects.all()[1]
        b2 = BankAccount.objects.all()[2]

        b0.current_balance = 5000   
        b1.current_balance = 12300
        b2.current_balance = 32700

        b0.save()
        b1.save()
        b2.save()
        

    def __create_user(self, inviter, invitee_phone_number):
        invitation = create_member_invitation(inviter, invitee_phone_number)
        return create_end_user(invitee_phone_number, invitation.invitation_code)

    def __create_repayment_transaction(self, loan_account, amount, time):
        loan_transaction = LoanTransaction.objects.create(
            transaction_type=LoanTransactionType.LOAN_REPAYMENT,
            loan_account=loan_account,
            amount=amount,
            initiated_at=time,
            processed_at=time,
            status=LoanTransactionStatus.PROCESSED)

        repayment.book_repayment(loan_transaction)

    def __create_disbursal_transaction(self, loan_account, amount, time):
        loan_transaction = LoanTransaction.objects.create(
            transaction_type=LoanTransactionType.LOAN_DISBURSAL,
            loan_account=loan_account,
            amount=amount,
            initiated_at=time,
            processed_at=time,
            status=LoanTransactionStatus.PROCESSED)

        loan_account.date_disbursed = time
        loan_account.is_active = True
        loan_account.status = LoanStatus.ACTIVE
        loan_account.save()

        if amount >= 50 and amount <= 500:
            transaction_fee = D("15.27")
        elif amount > 500:
            transaction_fee = D("22.40")

        disbursal.book_disbursal(
            loan_transaction, 
            disbursed_amount=amount,
            disbursal_fee=transaction_fee,
            save=True)


    def test_dashboard_data(self):
        def random_phone_number():
            rprefix = random.choice(safaricom.SAFARICOM_PREFIXES)
            rpostfix = ''.join(random.choice(string.digits) for _ in range(6))

            return f"{rprefix}{rpostfix}"
        
        time = timezone.localtime(
            datetime.datetime(
                2020, 
                1, 
                1, 
                random.randint(0,23), 
                random.randint(0,59), 
                random.randint(0,59), 
                tzinfo=timezone.utc))
        
        freezer = freezegun.freeze_time(time)
        freezer.start()

        api.fund_loan_book(D('50000'), D('1000'), notes="Finally")

        users = []

        for i in range(NO_OF_TEST_USERS):
            inviter = (users and random.choice(users)[0] or self.user)
            
            invitee_phone_number = random_phone_number()
            invitee = self.__create_user(inviter, invitee_phone_number)

            disbursal_day = random.randint(2, 8)

            users.append((invitee, disbursal_day))

        freezer.stop()
        
        next_day = time

        for day in range(1, 91):
            freezer = freezegun.freeze_time(next_day)
            freezer.start()

            for (invitee, disbursal_day) in sorted(users, key=lambda x: x[1]):
                #----------------
                invitee_loan_account = LoanAccount.objects\
                    .get(loan_profile__user_account__user=invitee)

                loan_profile = invitee_loan_account.loan_profile
                if day == 1:
                    identity = invitee.user_account.identities.get()
                    identity.status = IdentityStatus.VERIFIED
                    identity.save()

                    liability.book_identity_verification_amount(
                        loan_profile.user_account.identities.get(),
                        1
                    )

                repayment_days = (
                    disbursal_day + 10, 
                    disbursal_day + 15,
                    disbursal_day + 20,
                    disbursal_day + 23,
                    disbursal_day + 30,
                    disbursal_day + 35,
                    disbursal_day + 40,
                    disbursal_day + 50
                )
            
                if day == disbursal_day:
                    loan_profile.refresh_from_db()
                    disbursal_amount = loan_profile.loan_limit

                    if disbursal_amount > 0:
                        time = (
                            next_day + datetime.timedelta(
                                hours=random.randint(0, 12), 
                                minutes=random.randint(0, 59)))

                        self.__create_disbursal_transaction(
                            invitee_loan_account, 
                            disbursal_amount, 
                            time)

                        logger.debug('DISBURSEMENT')
                        logger.debug('*' * 200)

                elif day in repayment_days:
                    invitee_loan_account.refresh_from_db()
                    outstanding_balance = invitee_loan_account.outstanding_balance

                    if outstanding_balance > 0:
                        time = (
                            next_day + datetime.timedelta(
                                hours=random.randint(0, 12), 
                                minutes=random.randint(0, 59)))

                        amount = rounding.round_up(min(
                            outstanding_balance, 
                            random.choice([1050, 1100, 1500, 1200, 1700, outstanding_balance])
                        ), decimal_places=0)

                        if amount:
                            self.__create_repayment_transaction(
                                invitee_loan_account,
                                amount,
                                time)

                            logger.debug('REPAYMENT')
                        
                        logger.debug('*' * 200)

            #----------------
    
            next_hour = core_time.top_of_the_hour(next_day)

            for _ in range(24):
                _freezer = freezegun.freeze_time(next_hour)
                _freezer.start()
                
                balances.update_loan_ledger_balances(time=next_hour)

                _freezer.stop()
                next_hour += datetime.timedelta(hours=1)
            
            #----------------

            print("*" * 200)
            print(day, next_day)
            next_day = next_hour

            print("\n"*10)

            data = api.get_loan_dashboard_data()
            import pprint
            pprint.pprint(data)

            freezer.stop()

        entries = LoanTransactionEntry.objects\
            .all()\
            .values_list(
                'loan_transaction__transaction_id', #0
                'entry_date', #1
                'loan_transaction__loan_account__loan_profile__user_account__user__username', #2
                'loan_transaction__transaction_type', #3
                'ledger_account', #4
                'amount', #5
                'entry_type', #6
                named=True)

        rows = [
            ", ".join([
                'Transaction #', 
                'Entry Date',
                'Phone Number', 
                'Transaction Type', 
                'Ledger Account', 
                'Debit', 
                'Credit', 
            ])
        ]
        for entry in entries:
            row = []

            for (i, v) in enumerate(entry):
                if i == 3:
                    row.append(f'"{LoanTransactionType(v).get_text()}"')
                elif i == 4:
                    row.append(f'"{(LoanLedgerAccount.objects.get(id=v))}"')
                elif i == 5:
                    continue
                elif i == 6:
                    if EntryType(v) == EntryType.CREDIT:
                        row.append(str(0))
                        row.append(str(abs(entry.amount)))
                    elif EntryType(v) == EntryType.DEBIT:
                        row.append(str(abs(entry.amount)))
                        row.append(str(0))
                else:
                    row.append(f'"{v}"')
            
            rows.append(", ".join(row))

        with open('dump.csv', 'w+') as f:
            s = ""

            for (i, _) in enumerate(rows):
                s = f"{s}\n{_}"

            print(s, file=f)
