import logging
import requests

from .auth import MpesaBase

logger = logging.getLogger(__name__)

class C2B(MpesaBase):
    def __init__(self, *args, **kwargs):
        MpesaBase.__init__(self, *args, **kwargs)

    def register(self, shortcode=None, response_type=None, confirmation_url=None, validation_url=None):
        """This method uses Mpesa's C2B API to register validation and confirmation URLs on M-Pesa.

                                    **Args:**
                                        - shortcode (int): The short code of the organization.
                                        - response_type (str): Default response type for timeout. Incase a tranaction times out, Mpesa will by default Complete or Cancel the transaction.
                                        - confirmation_url (str): Confirmation URL for the client.
                                        - validation_url (str): Validation URL for the client.


                                    **Returns:**
                                        - OriginatorConverstionID (str): The unique request ID for tracking a transaction.
                                        - ConversationID (str): The unique request ID returned by mpesa for each request made
                                        - ResponseDescription (str): Response Description message


        """

        payload = {
            "ShortCode": shortcode,
            "ResponseType": response_type,
            "ConfirmationURL": confirmation_url,
            "ValidationURL": validation_url
        }
        
        SAF_URL = "/mpesa/c2b/v1/registerurl"
        response = self.request(SAF_URL, json=payload, timeout=self.timeout)
        
        if response is not None:
            logger.debug(response)
            return response
        else:
            logger.debug("finished transaction")

    def simulate(self, shortcode=None, command_id=None, amount=None, msisdn=None, bill_ref_number=None):
        """This method uses Mpesa's C2B API to simulate a C2B transaction.

                                            **Args:**
                                                - shortcode (int): The short code of the organization.
                                                - command_id (str): Unique command for each transaction type. - CustomerPayBillOnline - CustomerBuyGoodsOnline.
                                                - amount (int): The amount being transacted
                                                - msisdn (int): Phone number (msisdn) initiating the transaction MSISDN(12 digits)
                                                - bill_ref_number: Optional


                                            **Returns:**
                                                - OriginatorConverstionID (str): The unique request ID for tracking a transaction.
                                                - ConversationID (str): The unique request ID returned by mpesa for each request made
                                                - ResponseDescription (str): Response Description message


        """

        payload = {
            "ShortCode": shortcode,
            "CommandID": command_id,
            "Amount": amount,
            "Msisdn": msisdn,
            "BillRefNumber": bill_ref_number
        }
        logger.debug(payload)
        
        SAF_URL = "/mpesa/c2b/v1/simulate"
        response = self.request(SAF_URL, json=payload, timeout=self.timeout)
        
        if response is not None:
            logger.debug(response)
            return response
        else:
            logger.debug("finished transaction")
