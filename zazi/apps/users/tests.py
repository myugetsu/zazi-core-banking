from http import HTTPStatus

from decimal import Decimal as D

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from zazi.core import json

from zazi.apps.loan.models import LoanAccount, LoanStatus
from zazi.apps.mpesa.models import MpesaAccount, IdentifierType, AccountType, MpesaOrganization

from .models import generate_token, Token, UserAccount

DEFAULT_PIN = '5555'

class BaseAuthenticationTestCase(TestCase):
    def setUp(self):
        self.maxDiff = None
        self.user = get_user_model()\
            .objects\
            .create_user(username="254703255755", password=DEFAULT_PIN, email="test.user1@gmail.com")
        self.user_account = UserAccount.objects.create(user=self.user)
        self.organization = MpesaOrganization.objects.create(
            name="Tujisort MFI",
            owner=self.user
        )
        self.mpesa_account = MpesaAccount.objects.create(
            organization=self.organization,
            account_type=AccountType.PERSONAL_MPESA_ACCOUNT,
            identifier_type=IdentifierType.PERSONAL_MPESA,
            identifier="254703255755",
            is_active=True,
            has_completed_kyc=True)
        self.loan_account = LoanAccount.objects.create(
            mpesa_account=self.mpesa_account,
            owner=self.user,
            loan_limit=D('50.0'),
            status=LoanStatus.CLEAN,
            is_active=True)


        #----------------
        

        #------

        self.access_token = generate_token()
        self.refresh_token = generate_token()

        self.token = Token.objects.create(
            user=self.user,
            access=self.access_token,
            refresh=self.refresh_token
        )
        self.HTTP_AUTHORIZATION = 'Token %s' % self.access_token


class AuthenticationTestCase(BaseAuthenticationTestCase):
    def test_authenticate_user_returns_tokens_and_expiry_success(self):
        response = self.client.post(
            reverse('users:user_authentication'), 
            data={
                'phone_number': '254703255755', 
                'pin': DEFAULT_PIN
            })

        token = Token.objects.last()

        self.assertTrue(response.status_code, HTTPStatus.OK.value)
        self.assertEqual(
            response.json(), 
            {
                'success': True,
                'token': {
                    'access': token.access,
                    'refresh': token.refresh,
                    'expires': 3600 }})


    def test_get_user_is_accessible_via_token_successfully(self):
        response = self.client.get(
            reverse('users:get_user', kwargs={
                'user_account_id': self.user.user_account.account_id
            }),
            HTTP_AUTHORIZATION=self.HTTP_AUTHORIZATION)

        self.assertTrue(response.status_code, HTTPStatus.OK.value)
        self.assertEqual(
            response.json(), 
            json.loads(
                json.dumps({
                    'success': True,
                    'user_account': self.user_account.as_dict()
                })))


    def test_fetch_user_loan_account_is_accessible_via_token_successfully(self):
        response = self.client.get(
            reverse('users:get_user_loan_account', kwargs={
                'user_account_id': self.user.user_account.account_id
            }),
            HTTP_AUTHORIZATION=self.HTTP_AUTHORIZATION)
        
        self.assertTrue(response.status_code, HTTPStatus.OK.value)
        self.assertEqual(
            response.json(), 
            json.loads(
                json.dumps({
                    'success': True,
                    'loan_accounts': [
                        loan_account.as_dict() 
                            for loan_account in
                                self.user_account.user.loan_accounts.all()
                    ]
                })))