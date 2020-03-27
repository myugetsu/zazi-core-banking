import base64
import datetime
import logging
import requests

from django.conf import settings

from .auth import MpesaBase

logger = logging.getLogger(__name__)


class MpesaExpress(MpesaBase):
    def __init__(self, *args, **kwargs):
        MpesaBase.__init__(self, *args, **kwargs)

    def stk_push(self, business_shortcode=None, passcode=None, amount=None, callback_url=None, reference_code=None,
                 phone_number=None, description=None):
        """This method uses Mpesa's Express API to initiate online payment on behalf of a customer..

                                                    **Args:**
                                                        - business_shortcode (int): The short code of the organization.
                                                        - passcode (str): Get from developer portal
                                                        - amount (int): The amount being transacted
                                                        - callback_url (str): A CallBack URL is a valid secure URL that is used to receive notifications from M-Pesa API.
                                                        - reference_code: Account Reference: This is an Alpha-Numeric parameter that is defined by your system as an Identifier of the transaction for CustomerPayBillOnline transaction type.
                                                        - phone_number: The Mobile Number to receive the STK Pin Prompt.
                                                        - description: This is any additional information/comment that can be sent along with the request from your system. MAX 13 characters


                                                    **Returns:**
                                                        - CustomerMessage (str):
                                                        - CheckoutRequestID (str):
                                                        - ResponseDescription (str):
                                                        - MerchantRequestID (str):
                                                        - ResponseCode (str):

        """

        time = str(datetime.datetime.now()).split(".")[0].replace("-", "").replace(" ", "").replace(":", "")
        password = "{0}{1}{2}".format(str(business_shortcode), str(passcode), time)
        encoded = base64.b64encode(password.encode('ascii')).decode("utf-8")

        payload = {
            "BusinessShortCode": business_shortcode,
            "Password": encoded,
            "Timestamp": time,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": int(phone_number),
            "PartyB": business_shortcode,
            "PhoneNumber": int(phone_number),
            "CallBackURL": callback_url,
            "AccountReference": reference_code,
            "TransactionDesc": description
        }
        logger.debug(payload)
        
        SAF_URL = "/mpesa/stkpush/v1/processrequest"
        response = self.request(SAF_URL, json=payload, timeout=self.timeout)
        
        if response is not None:
            logger.debug(response)
            return response
        else:
            logger.debug("finished transaction")


    def query(self, business_shortcode=None, checkout_request_id=None, passcode=None):
        """This method uses Mpesa's Express API to check the status of a Lipa Na M-Pesa Online Payment..

                                                    **Args:**
                                                        - business_shortcode (int): This is organizations shortcode (Paybill or Buygoods - A 5 to 6 digit account number) used to identify an organization and receive the transaction.
                                                        - checkout_request_id (str): This is a global unique identifier of the processed checkout transaction request.
                                                        - passcode (str): Get from developer portal


                                                    **Returns:**
                                                        - CustomerMessage (str):
                                                        - CheckoutRequestID (str):
                                                        - ResponseDescription (str):
                                                        - MerchantRequestID (str):
                                                        - ResponseCode (str):


        """

        time = str(datetime.datetime.now()).split(".")[0].replace("-", "").replace(" ", "").replace(":", "")
        password = "{0}{1}{2}".format(str(business_shortcode), str(passcode), time)
        encoded = str(base64.b64encode(password.encode('ascii')))
        payload = {
            "BusinessShortCode": business_shortcode,
            "Password": encoded,
            "Timestamp": time,
            "CheckoutRequestID": checkout_request_id
        }
        logger.debug(payload)
        
        SAF_URL = "/mpesa/stkpushquery/v1/query"
        response = self.request(SAF_URL, json=payload, timeout=self.timeout)
        
        if response is not None:
            logger.debug(response)
            return response
        else:
            logger.debug("finished transaction")
        