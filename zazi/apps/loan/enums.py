from zazi.core.enums import IntEnumChoices

class LoanProfileStatus(IntEnumChoices):
    CLEAN = 0
    PERFORMING = 1
    DELINQUENT = 2
    DEFAULT = 2
    BLACKLISTED = 3
    SUSPENDED = 4

    def get_text(self):
        return {
            LoanProfileStatus.CLEAN: "CLEAN",
            LoanProfileStatus.PERFORMING: "PERFORMING",
            LoanProfileStatus.DELINQUENT: "DELINQUENT",
            LoanProfileStatus.DEFAULT: "DEFAULT",
            LoanProfileStatus.BLACKLISTED: "BLACKLISTED",
            LoanProfileStatus.SUSPENDED: "SUSPENDED"
        }[self]

class LoanStatus(IntEnumChoices):
    CLEAN = 0
    PENDING_DISBURSEMENT = 1
    DISBURSED = 2
    ACTIVE = 3
    PAID_OFF = 4
    IN_ARREARS = 5
    DEFAULTED = 6
    WRITTEN_OFF = 7
    DORMANT = 8
    CLOSED = 9

class LoanAllocationItem(IntEnumChoices):
    PENALTY = 1
    FEES = 2
    INTEREST = 3
    PRINCIPAL = 4
    LIABILITY = 5

    def get_text(self):
        return {
            LoanAllocationItem.PENALTY: "Penalty",
            LoanAllocationItem.FEES: "Fees",
            LoanAllocationItem.INTEREST: "Interest",
            LoanAllocationItem.PRINCIPAL: "Principal",
            LoanAllocationItem.LIABILITY: "Liability"
        }[self]

class PaymentPlatform(IntEnumChoices):
    MPESA = 1
    PESA_LINK = 2
    AIRTEL = 3

    def get_text(self):
        return {
            PaymentPlatform.MPESA: "Mpesa",
            PaymentPlatform.PESA_LINK: "Pesa Link",
            PaymentPlatform.AIRTEL: "Airtel"
        }[self]

class LoanInterestMethod(IntEnumChoices):
    REDUCING_BALANCE = 1

class LoanInterestRateAccrualSchedule(IntEnumChoices):
    DAILY = 1
    WEEKLY = 2
    MONTHLY = 3

class LoanTransactionType(IntEnumChoices):
    LOAN_DISBURSAL = 1
    LOAN_REPAYMENT = 2

    INTEREST_ACCRUAL = 3
    PENALTY_ACCRUAL = 4
    FEES_ACCRUAL = 5

    WRITE_OFF = 5
    LOAN_LIABILITY = 6

    def get_text(self):
        return {
            LoanTransactionType.LOAN_DISBURSAL: "LOAN_DISBURSAL",
            LoanTransactionType.LOAN_REPAYMENT: "LOAN_REPAYMENT",
            LoanTransactionType.INTEREST_ACCRUAL: "INTEREST_ACCRUAL",
            LoanTransactionType.PENALTY_ACCRUAL: "PENALTY_ACCRUAL",
            LoanTransactionType.FEES_ACCRUAL: "FEES_ACCRUAL",
            LoanTransactionType.WRITE_OFF: "WRITE_OFF",
            LoanTransactionType.LOAN_LIABILITY: "LOAN_LIABILITY",
        }[self]

class LoanProductType(IntEnumChoices):
    REVOLVING_LOAN = 1
    TERM_LOAN = 2

class LoanTransactionStatus(IntEnumChoices):
    PENDING_PROCESSING = 1
    PROCESSED = 2
    POSTED_TO_LOANS_LEDGER = 3