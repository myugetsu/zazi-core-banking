import os
import io

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files import File
from django.test import RequestFactory, TestCase

from unittest.mock import patch, Mock, MagicMock, call

from django.urls import reverse_lazy
from django.utils import timezone

from zazi.apps.loan.models import LoanAccount
from zazi.apps.users.tests import BaseAuthenticationTestCase, DEFAULT_PIN
from zazi.core import json
from zazi.core.utils import get_absolute_url

from ..models import MpesaOrganization, MpesaAccount, LipaNaMpesaAccount, \
    MpesaAPIAccount, MpesaTransaction, MpesaAccountRegisteredURL
from ..enums import DocumentType, IdentifierType, UserType, ResultCode, AccountType


User = get_user_model()

C2B_STK_MPESA_EXPRESS_RESPONSE = {
	"Body": 
	{
		"stkCallback": 
		{
			"MerchantRequestID": "21605-295434-4",
			"CheckoutRequestID": "ws_CO_04112017184930742",
			"ResultCode": 0,
			"ResultDesc": "The service request is processed successfully.",
			"CallbackMetadata": 
			{
				"Item": 
				[
					{
						"Name": "Amount",
						"Value": '100'
					},
					{
						"Name": "MpesaReceiptNumber",
						"Value": 'LK451H35OP'
					},
					{
						"Name": "Balance"
					},
					{
						"Name": "TransactionDate",
						"Value": '20190704184944'
					},
					{
						"Name": "PhoneNumber",
						"Value": '254703255755'
					}
				]
			}
		}
	}
}

B2C_RESPONSE = {
    "Result": {
        "ResultType":0,
        "ResultCode":0,
        "ResultDesc":"The service request has been accepted successfully.",
        "OriginatorConversationID":"14593-80515-2",
        "ConversationID":"AG_20170821_000049448b24712383de",
        "TransactionID":"LHL41AHJ6G",
        "ResultParameters": {
            "ResultParameter":[
                {
                    "Key":"TransactionAmount",
                    "Value":100
                },
                {
                    "Key":"TransactionReceipt",
                    "Value":"LHL41AHJ6G"
                },
                {
                    "Key":"B2CRecipientIsRegisteredCustomer",
                    "Value":"Y"
                },
                {
                    "Key":"B2CChargesPaidAccountAvailableFunds",
                    "Value":0.00
                },
                {
                    "Key":"ReceiverPartyPublicName",
                    "Value":"254703267860 - John Doe"
                },
                {
                    "Key":"TransactionCompletedDateTime",
                    "Value":"21.08.2017 12:01:59"
                },
                {
                    "Key":"B2CUtilityAccountAvailableFunds",
                    "Value":98834.00
                },
                {
                    "Key":"B2CWorkingAccountAvailableFunds",
                    "Value":100000.00
                }
            ]
        },
        "ReferenceData": {
            "ReferenceItem": {
                "Key":"QueueTimeoutURL",
                "Value":"https:\/\/internalsandbox.safaricom.co.ke\/mpesa\/b2cresults\/v1\/submit"
            }
        }
    }
}

class MpesaIntegrationTestCase(BaseAuthenticationTestCase):
    def setUp(self):
        super().setUp()

        self.paybill_c2b_account = MpesaAccount.objects.create(
            organization=self.organization,
            identifier_type=IdentifierType.BUSINESS_PAYBILL,
            identifier="263801",
            account_type=AccountType.C2B_PAYBILL_ACCOUNT,
            document_type=DocumentType.COMPANY_REG_NO,
            document_number="CR3232",
            is_active=True)
        self.lnm_account = LipaNaMpesaAccount.objects.create(
            account=self.paybill_c2b_account,
            pass_code='sa247hajsa' * 3)

        self.paybill_b2c_account = MpesaAccount.objects.create(
            organization=self.organization,
            identifier_type=IdentifierType.BUSINESS_PAYBILL,
            identifier="263802",
            account_type=AccountType.B2C_BULK_PAYMENTS_ACCOUNT,
            document_type=DocumentType.COMPANY_REG_NO,
            document_number="CR3232",
            is_active=True)
    
        self.paybill_c2b_api_account = MpesaAPIAccount.objects.create(
            organization=self.organization,
            linked_account=self.paybill_c2b_account,
            in_production=False,
            username="apitest527",
            security_credential="password",
            user_type=UserType.ORG_API_OPERATOR,
            consumer_key="wThWqhoWPORf7YjF3jgxdS1t9WQGn6GE",
            consumer_secret="kCQVbJIqmOnDXeNJ")
        self.paybill_b2c_api_account = MpesaAPIAccount.objects.create(
            organization=self.organization,
            linked_account=self.paybill_b2c_account,
            username="apitest526",
            security_credential="password",
            user_type=UserType.BUSINESS_ADMINISTRATOR,
            in_production=False,
            consumer_key="wThWqhoWPORf7YjF3jgxdS1t9WQGn6GE_",
            consumer_secret="kCQVbJIqmOnDXeNJ_")


    @patch("zazi.apps.mpesa.api.authenticate")
    def test_mpesa_authentication_works(self, authenticate):
        authenticate.return_value = {
            "access_token": "JZIAHHsd43435jjKSu238007K98SO",
            "expires_in": "3599"
        }

        response = self.client.post(
            reverse_lazy('mpesa:mpesa_api_authenticate', kwargs={
                'organization_id': self.organization.organization_id, 
            }), 
            data={
                'short_code': '263801'
            },
            HTTP_AUTHORIZATION=self.HTTP_AUTHORIZATION)

        auth_response = response.json()

        self.assertTrue('authentication_token' in auth_response)
        self.assertTrue(response.status_code, 200)

    @patch("zazi.core.utils.get_encrypted_text")
    @patch("zazi.apps.mpesa.api.authenticate")
    @patch("zazi.apps.mpesa.api.b2c_transact")
    def test_mpesa_b2c_works(self, b2c_transact, authenticate, get_encrypted_text):
        expected_mpesa_token_response = {
            "access_token": "JZIAHHsd43435jjKSu238007K98SO",
            "expires_in": "3599"
        }
        b2c_transact.return_value = {
            "ConversationID": "AG_20180326_00005ca7f7c21d608166",
            "OriginatorConversationID": "12363-1328499-6",
            "ResponseCode": "0",
            "ResponseDescription": "Accept the service request successfully."
        }
        get_encrypted_text.return_value = {
            "encrypted": "%s==" % ("ahh2iza7823kasksa" * 7)
        }
        authenticate.return_value = expected_mpesa_token_response

        response = self.client.post(reverse_lazy('mpesa:mpesa_api_authenticate', kwargs={
                'organization_id': self.organization.organization_id, 
            }), data={
                'short_code': '263801'
            },
            HTTP_AUTHORIZATION=self.HTTP_AUTHORIZATION)

        auth_response = response.json()

        self.assertTrue(auth_response, expected_mpesa_token_response)
        self.assertTrue(response.status_code, 200)

        response = self.client.post(reverse_lazy('mpesa:mpesa_b2c_transact', kwargs={
                'organization_id': self.organization.organization_id, 
            }), {
                'short_code': '263801',
                'phone_number': '254703255755',
                'amount': '200.00',
                'notes': 'Loan to John'
            },
            HTTP_AUTHORIZATION=self.HTTP_AUTHORIZATION)

        b2c_response = response.json()
        transaction = MpesaTransaction.objects.last()

        self.assertEqual({
            'success': True,
            'message': 'B2C Transaction successful',
            'transaction_id': transaction.third_party_transaction_id
        }, b2c_response)


        self.assertTrue(response.status_code, 200)

        request_payload = transaction.request_payload

        self.assertTrue('conversation_id' in request_payload)
        self.assertTrue('originator_conversation_id' in request_payload)
        self.assertTrue('response_code' in request_payload)
        self.assertTrue(request_payload['response_description'] == 'Accept the service request successfully.')

        #simulate a webhook from M-Pesa; does not require token as its csrf token exempted
        response = self.client.post(reverse_lazy('mpesa:mpesa_b2c_result_url', kwargs={
                'organization_id': self.organization.organization_id, 
                'reference': transaction.third_party_transaction_id
            }), json.dumps(B2C_RESPONSE),
            content_type="application/json")

        #refresh the model from the db
        transaction.refresh_from_db()

        self.assertEquals({
            'transaction_id': 'LHL41AHJ6G',
            'transaction_recipient_full_name': 'John Doe',
            'transaction_recipient_first_name': 'John',
            'transaction_recipient_middle_name': '',
            'transaction_recipient_last_name': 'Doe',
            'transaction_recipient_phone': '254703267860',
            'transaction_amount': 100,
            'transaction_completed_at': '21.08.2017 12:01:59',
            'b2c_utility_balance': 98834.0,
            'b2c_working_account_balance': 100000.0,
            'kyc_is_registered_mpesa_user': 'Y',
            'conversation_id': 'AG_20170821_000049448b24712383de',
            'originator_conversation_id': '14593-80515-2',
            'result_code': 0,
            'result_description': 'The service request has been accepted successfully.',
        }, transaction.response_payload)

    @patch("zazi.apps.mpesa.api.authenticate")
    @patch("zazi.apps.mpesa.api.b2c_transact")
    def test_mpesa_b2c_works(self, b2c_transact, authenticate, ):
        expected_mpesa_token_response = {
            "access_token": "JZIAHHsd43435jjKSu238007K98SO",
            "expires_in": "3599"
        }


    @patch("zazi.core.utils.get_encrypted_text")
    @patch("zazi.apps.mpesa.api.authenticate")
    @patch("zazi.apps.mpesa.api.c2b_register_url")
    def test_mpesa_c2b_works(self, c2b_register_url, authenticate, get_encrypted_text):
        c2b_register_url.return_value = {
            "ConversationID": "",
            "OriginatorCoversationID": "",
            "ResponseDescription": "success"
        }
        authenticate.return_value = {
            "access_token": "JZIAHHsd43435jjKSu238007K98SO",
            "expires_in": "3599"
        }
        get_encrypted_text.return_value = {
            "encrypted": "%s==" % ("ahh2iza7823kasksa" * 7)
        }

        response = self.client.post(reverse_lazy('mpesa:mpesa_api_authenticate', kwargs={
                'organization_id': self.organization.organization_id, 
            }), {
                'short_code': '263801'
            }, 
            HTTP_AUTHORIZATION=self.HTTP_AUTHORIZATION)

        auth_response = response.json()

        self.assertTrue('authentication_token' in auth_response)
        self.assertTrue(response.status_code, 200)

        response = self.client.post(reverse_lazy('mpesa:mpesa_c2b_register_urls', kwargs={
                'organization_id': self.organization.organization_id, 
            }), {
                "short_code": self.paybill_c2b_account.identifier,
            },
            HTTP_AUTHORIZATION=self.HTTP_AUTHORIZATION)

        self.assertTrue(response.json()['success'])
        mpesa_registered_url_reference = response.json()['mpesa_registered_url']
        
        mpesa_registered_url = MpesaAccountRegisteredURL.objects.get(
            reference=mpesa_registered_url_reference)

        self.assertEquals(mpesa_registered_url.validation_url, get_absolute_url("mpesa:mpesa_c2b_validation_url", kwargs={
            "organization_id": self.organization.organization_id,
            "reference": mpesa_registered_url_reference
        }))
        self.assertEquals(mpesa_registered_url.confirmation_url, get_absolute_url("mpesa:mpesa_c2b_confirmation_url", kwargs={
            "organization_id": self.organization.organization_id,
            "reference": mpesa_registered_url_reference
        }))

        #simulate a webhooks from M-Pesa
        response = self.client.post(reverse_lazy('mpesa:mpesa_c2b_validation_url', kwargs={
                'organization_id': self.organization.organization_id, 
                'reference': mpesa_registered_url.reference
            }), json.dumps({
                "TransactionType": "",
                "TransID": "LHG31AA5TX",
                "TransTime": "20190816190243",
                "TransAmount": "200.00",
                "BusinessShortCode": self.paybill_c2b_account.identifier,
                "BillRefNumber": "account",
                "InvoiceNumber": "",
                "OrgAccountBalance": "",
                "ThirdPartyTransID": "",
                "MSISDN": self.mpesa_account.identifier,
                "FirstName": self.mpesa_account.first_name,
                "MiddleName": "",
                "LastName": self.mpesa_account.last_name
            }),
            content_type="application/json")
        
        self.assertEqual(response.json(), {
            'ResultCode': ResultCode.success, 
            'ResultDesc': 'Accepted'
        })

        transaction = MpesaTransaction.objects.last()

        transaction.refresh_from_db()
        self.assertEqual(transaction.result_code, None)


        response = self.client.post(reverse_lazy('mpesa:mpesa_c2b_confirmation_url', kwargs={
                'organization_id': self.organization.organization_id, 
                'reference': mpesa_registered_url_reference
            }), json.dumps({
                "TransID": "LHG31AA5TX",
                "TransactionType": "",
                "TransTime": "20190816190243",
                "TransAmount": "200.00",
                "BusinessShortCode": self.paybill_c2b_account.identifier,
                "BillRefNumber": "account",
                "InvoiceNumber": "",
                "OrgAccountBalance": "",
                "ThirdPartyTransID": "",
                "MSISDN": self.mpesa_account.identifier,
                "FirstName": self.mpesa_account.first_name,
                "MiddleName": "",
                "LastName": self.mpesa_account.last_name
            }),
            content_type="application/json")


        self.assertEqual(response.json(), {
            'ResultCode': ResultCode.success, 
            'ResultDesc': 'Accepted'
        })

        transaction.refresh_from_db()
        self.assertEqual(transaction.result_code, ResultCode.success)


    @patch("zazi.apps.mpesa.api.mpesa_express_stk_push")
    @patch("zazi.core.utils.get_encrypted_text")
    @patch("zazi.apps.mpesa.api.authenticate")
    @patch("zazi.apps.mpesa.api.b2c_transact")
    def test_mpesa_user_can_register_and_borrow(self, b2c_transact, authenticate, get_encrypted_text, mpesa_express_stk_push):

        b2c_transact.return_value = {
            "ConversationID": "AG_20180326_00005ca7f7c21d608166",
            "OriginatorConversationID": "12363-1328499-6",
            "ResponseCode": "0",
            "ResponseDescription": "Accept the service request successfully."
        }
        authenticate.return_value = {
            "access_token": "JZIAHHsd43435jjKSu238007K98SO",
            "expires_in": "3599"
        }
        get_encrypted_text.return_value = {
            "encrypted": "%s==" % ("ahh2iza7823kasksa" * 7)
        }
        mpesa_express_stk_push.return_value = {
            "MerchantRequestID": "21605-295434-4",
			"CheckoutRequestID": "ws_CO_04112017184930742",
            "ResponseCode": "0",
            "ResponseDescription": "Success. Request accepted for processing",
            "CustomerMessage": "Success. Request accepted for processing"
        }

        #------------- Setup
        
        # 3. Now, borrow the amount
        response = self.client.post(reverse_lazy('mpesa:mpesa_express_c2b_push', kwargs={
                'organization_id': self.organization.organization_id
            }), data={
                'short_code': '263801',
                'phone_number': self.user.username,
                'amount': 320,
                'notes': 'My notes'
            },
            HTTP_AUTHORIZATION=self.HTTP_AUTHORIZATION)
        transaction = MpesaTransaction.objects.last()
        self.assertEqual(response.json(), json.loads(json.dumps({
            'success': True,
            'transaction': transaction.as_dict()
        })))

        # 3. Simulate callback from M-Pesa
        response = self.client.post(reverse_lazy('mpesa:mpesa_c2b_stk_push_callback_url', kwargs={
                'organization_id': self.organization.organization_id, 
                'reference': transaction.third_party_transaction_id
            }), json.dumps(C2B_STK_MPESA_EXPRESS_RESPONSE),
            content_type="application/json")

        self.assertEqual(response.json(), {'ResultCode': 0, 'ResultDesc': 'Accepted'})

