from collections import namedtuple

from decimal import Decimal as D

#----------------------

import logging
logger = logging.getLogger(__name__)

#----------------------

def clean_b2c_transaction_details(data):
    transaction_details = {}
    swap = {
        "ResultCode": "result_code",
        "ResultDesc": "result_description",
        "OriginatorConversationID": "originator_conversation_id",
        "ConversationID": "conversation_id",
        "TransactionID": "transaction_id",
        "TransactionAmount": "transaction_amount",
        "TransactionReceipt": "transaction_id",
        "B2CRecipientIsRegisteredCustomer": "kyc_is_registered_mpesa_user",
        "B2CChargesPaidAccountAvailableFunds": "transaction_charge",
        "ReceiverPartyPublicName": "transaction_recipient_full_name",
        "TransactionCompletedDateTime": "transaction_completed_at",
        "B2CUtilityAccountAvailableFunds": "b2c_utility_balance",
        "B2CWorkingAccountAvailableFunds": "b2c_working_account_balance" }

    if (data.get('Result', {}).get('ResultCode') or 0) != 0:
        logger.debug("Failed b2c Transaction")
        return

    for k, v in swap.items():
        if k in data['Result']:
            transaction_details[v] = data['Result'][k]

    for result_parameter in data.get('Result', {}).get('ResultParameters', {}).get('ResultParameter'):
        item = swap[result_parameter['Key']]
        value = result_parameter['Value'] or None

        if not value:
            continue

        if item == 'transaction_recipient_full_name':
            try:
                (phone, value) = str(value).split(" - ")
                transaction_details['transaction_recipient_phone'] = phone
            except Exception:
                value = result_parameter['Value']

            (transaction_details['transaction_recipient_first_name'], 
            *transaction_details['transaction_recipient_middle_name'], 
            transaction_details['transaction_recipient_last_name']) = value.split(" ")

            # this is a list, join if anything 
            transaction_details['transaction_recipient_middle_name'] = (
                " ".join(transaction_details['transaction_recipient_middle_name']))

        transaction_details[item] = value

    return transaction_details


#-----------

def change_case(str): 
    res = [str[0].lower()] 
    for c in str[1:]: 
        if c in ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'): 
            res.append('_') 
            res.append(c.lower()) 
        else: 
            res.append(c) 
      
    return ''.join(res) 

def clean_stk_response(data):
    stkcallback = data.get('Body', {}).get('stkCallback', {})

    cleaned = {
        "merchant_request_id": stkcallback.get('MerchantRequestID'),
        "checkout_request_id": stkcallback.get('CheckoutRequestID'),
        "result_code": stkcallback.get('ResultCode'),
        "result_desc": stkcallback.get('ResultDesc') }

    if stkcallback and stkcallback.get('ResultCode') == 0:
        swap = dict(
            Amount='amount',
            MpesaReceiptNumber='mpesa_receipt_number',
            Balance='balance',
            TransactionDate='transaction_date',
            PhoneNumber='phone_number')

        for item in stkcallback.get("CallbackMetadata", {}).get('Item', []):
            if item['Name'] ==  "Balance":
                cleaned[swap[item['Name']]] = item.get('Value', 0)
            else:
                cleaned[swap[item['Name']]] = item['Value']

    return cleaned


def clean_balance_response(data):
    logger.debug(data)

    cleaned = {
        "result_code": data.get('Result', {}).get('ResultCode'),
        "result_type": data.get('Result', {}).get('ResultType'),
        "result_desc": data.get('Result', {}).get('ResultDesc'), 
        "originator_conversation_id": data.get('Result', {}).get('OriginatorConversationID'),
        "conversation_id": data.get('Result', {}).get('ConversationID'),
    }

    if (data.get('Result', {}).get('ResultCode') or 0) == 0:
        cleaned.update({
            "merchant_request_id": data.get('Result', {}).get('MerchantRequestID'),
            "checkout_request_id": data.get('Result', {}).get('CheckoutRequestID'),
            "transaction_id": data.get('Result', {}).get('TransactionID'),
            'balances': [],
            'transaction_time': None 
        })
    else:
        return cleaned


    results = data.get('Result', {}).get('ResultParameters', {}).get('ResultParameter', {})
    for item in results:
        if item['Key'] == 'AccountBalance':
            values = item['Value']
            for account_details in values.split('&'):
                (account, currency, _balance, *_) = account_details.split('|')
                
                balance = dict(
                    account=account, 
                    currency=currency, 
                    balance=D(_balance))

                cleaned['balances'].append(balance)

        elif item['Key'] == 'BOCompletedTime':
            cleaned['transaction_time'] = item['Value']

    return cleaned

    
