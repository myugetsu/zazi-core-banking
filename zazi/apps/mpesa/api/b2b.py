import logging

import requests
from .auth import MpesaBase

logger = logging.getLogger(__name__)

class B2B(MpesaBase):
    def __init__(self, *args, **kwargs):
        MpesaBase.__init__(self, *args, **kwargs)

    def transact(self, initiator=None, security_credential=None, command_id=None, sender_identifier_type=None,
                 receiver_identifier_type=None, amount=None, party_a=None, party_b=None, remarks=None,
                 account_reference=None, queue_timeout_url=None, result_url=None):
        """This method uses Mpesa's B2B API to transact from one company to another.

            **Args:**
                - initiator (str): Username used to authenticate the transaction.
                - security_credential (str): Generate from developer portal
                - command_id (str): Options: BusinessPayBill, BusinessBuyGoods, DisburseFundsToBusiness, BusinessToBusinessTransfer ,BusinessTransferFromMMFToUtility, BusinessTransferFromUtilityToMMF, MerchantToMerchantTransfer, MerchantTransferFromMerchantToWorking, MerchantServicesMMFAccountTransfer, AgencyFloatAdvance
                - sender_identifier_type (str): 2 for Till Number, 4 for organization shortcode
                - receiver_identifier_type (str): # 2 for Till Number, 4 for organization shortcode
                - amount(str): Amount.
                - party_a (int): Sender shortcode.
                - party_b (int): Receiver shortcode.
                - remarks (str): Comments that are sent along with the transaction(maximum 100 characters).
                - account_reference (str): Use if doing paybill to banks etc.
                - queue_timeout_url (str): The url that handles information of timed out transactions.
                - result_url (str): The url that receives results from M-Pesa api call.


            **Returns:**
                - OriginatorConversationID (str): The unique request ID for tracking a transaction.
                - ConversationID (str): The unique request ID returned by mpesa for each request made
                - ResponseDescription (str): Response Description message


        """

        payload = {
            "Initiator": initiator,
            "SecurityCredential": security_credential,
            "CommandID": command_id,
            "SenderIdentifierType": sender_identifier_type,
            "RecieverIdentifierType": receiver_identifier_type,
            "Amount": amount,
            "PartyA": party_a,
            "PartyB": party_b,
            "Remarks": remarks,
            "AccountReference": account_reference,
            "QueueTimeOutURL": queue_timeout_url,
            "ResultURL": result_url
        }
        
        SAF_URL = "/mpesa/b2b/v1/paymentrequest"
        response = self.request(SAF_URL, json=payload, timeout=self.timeout)

        if response is not None:
            return response
        else:
            logger.debug("finished B2B.transact")
        
