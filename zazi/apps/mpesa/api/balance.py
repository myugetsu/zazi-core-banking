import logging
import requests

from .auth import MpesaBase

logger = logging.getLogger(__name__)

class Balance(MpesaBase):
    def __init__(self, *args, **kwargs):
        MpesaBase.__init__(self, *args, **kwargs)

    def get_balance(self, initiator=None, security_credential=None, command_id=None, party_a=None, identifier_type=None,
                    remarks=None, queue_timeout_url=None,result_url=None):
        """This method uses Mpesa's Account Balance API to to enquire the balance on an M-Pesa BuyGoods (Till Number).

                            **Args:**
                                - initiator (str): Username used to authenticate the transaction.
                                - security_credential (str): Generate from developer portal.
                                - command_id (str): AccountBalance.
                                - party_a (int): Till number being queried.
                                - identifier_type (int): Type of organization receiving the transaction. Options: 1 - MSISDN 2 - Till Number  4 - Organization short code
                                - remarks (str): Comments that are sent along with the transaction(maximum 100 characters).
                                - queue_timeout_url (str): The url that handles information of timed out transactions.
                                - result_url (str): The url that receives results from M-Pesa api call.


                            **Returns:**
                                - OriginatorConverstionID (str): The unique request ID for tracking a transaction.
                                - ConversationID (str): The unique request ID returned by mpesa for each request made
                                - ResponseDescription (str): Response Description message


        """

        payload = {
            "Initiator": initiator,
            "SecurityCredential": security_credential,
            "CommandID": command_id,
            "PartyA": party_a,
            "IdentifierType": identifier_type,
            "Remarks": remarks,
            "QueueTimeOutURL": queue_timeout_url,
            "ResultURL": result_url
        }
        logger.debug(payload)
        
        SAF_URL = "/mpesa/accountbalance/v1/query"
        response = self.request(SAF_URL, json=payload, timeout=self.timeout)

        if response is not None:
            logger.debug(response)
            return response
        else:
            logger.debug("finished transaction")

