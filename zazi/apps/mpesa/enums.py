from zazi.core.enums import IntEnumChoices, StrEnumChoices


class DocumentType(IntEnumChoices):
    ID_NUMBER = 1
    PASSPORT_NUMBER = 2
    COMPANY_REG_NO = 3


class MpesaTransactionCategory(IntEnumChoices):
    LOAN_TRANSACTION = 1
    IDENTITY_VERIFICATION = 2


class TransactionEntryType(IntEnumChoices):
    CREDIT = 0
    DEBIT = 1


class IdentifierType(IntEnumChoices):
    PERSONAL_MPESA = 1
    BUSINESS_LIPA_NA_MPESA = 2
    BUSINESS_PAYBILL = 4


class CommandID(StrEnumChoices):
    UTILITY_TRANSACTION_REVERSAL = "TransactionReversal"
    UTILITY_ACCOUNT_BALANCE = "AccountBalance"
    UTILITY_TRANSACTION_STATUS_QUERY = "TransactionStatusQuery"
    UTILITY_CHECK_IDENTITY = "CheckIdentity"

    B2B_BUSINESS_PAYBILL = "BusinessPayBill"
    B2B_BUSINESS_BUY_GOODS = "BusinessBuyGoods"
    B2B_DISBURSE_FUNDS_TO_BUSINESS = "DisburseFundsToBusiness"
    B2B_BUSINESS_TO_BUSINESS_TRANSFER = "BusinessToBusinessTransfer"
    B2B_BUSINESS_TRANSFER_FROM_MMF_TO_UTILITY = "BusinessTransferFromMMFToUtility"
    B2B_BUSINESS_TRANSFER_FROM_UTILITY_TO_MMF = "BusinessTransferFromUtilityToMMF"
    B2B_MERCHANT_TO_MERCHANT_TRANSFER = "MerchantToMerchantTransfer"
    B2B_MERCHANT_TRANSFER_FROM_MERCHANT_TO_WORKING = "MerchantTransferFromMerchantToWorking"
    B2B_MERCHANT_SERVICES_MMF_ACCOUNT_TRANSFER = "MerchantServicesMMFAccountTransfer"
    B2B_AGENCY_FLOAT_ADVANCE = "AgencyFloatAdvance"

    B2C_SALARY_PAYMENT = "SalaryPayment"
    B2C_BUSINESS_PAYMENT = "BusinessPayment"
    B2C_PROMOTION_PAYMENT = "PromotionPayment"
    
    C2B_PAYBILL = "CustomerPayBillOnline"
    C2B_TILL_NUMBER = "CustomerBuyGoodsOnline"


class ResultCode(IntEnumChoices):
    success = 0
    insufficient_funds = 1
    less_than_minimum_transaction_value = 2
    more_than_maximum_transaction_value = 3
    would_exceed_daily_transfer_limit = 4
    would_exceed_minimum_balance = 5
    unresolved_primary_party = 6
    unresolved_receiver_party = 7
    would_exceed_maxiumum_balance = 8
    debit_account_invalid = 11
    credit_account_invalid = 12
    unresolved_debit_account = 13
    unresolved_credit_account = 14
    duplicate_detected = 15
    internal_failure = 17
    unresolved_initiator = 20
    traffic_blocking_condition_in_place = 26
    stk_cancelled_by_user = 1032


class ResponseType(StrEnumChoices):
    cancelled = "Cancelled"
    completed = "Completed"

class UserType(IntEnumChoices):
    BUSINESS_ADMINISTRATOR = 1
    BUSINESS_MANAGER = 2
    ORG_API_OPERATOR = 3

class AccountType(IntEnumChoices):
    B2C_BULK_PAYMENTS_ACCOUNT = 1
    C2B_PAYBILL_ACCOUNT = 2

    PERSONAL_MPESA_ACCOUNT = 3
    AGENCY_MPESA_ACCOUNT = 4

class MpesaTransactionStatus(IntEnumChoices):
    PENDING = 0
    COMPLETED = 1
    CANCELLED = 2
    FAILED = 3

class MpesaC2BAPIType(IntEnumChoices):
    MPESA_EXPRESS_STK_PUSH = 1