from zazi.core.enums import IntEnumChoices

class BankingTransactionType(IntEnumChoices):
    DEPOSIT = 1
    WITHDRAW = 2
    TRANSFER = 3


class BankAccountType(IntEnumChoices):
    MOBILE_MONEY_ACCOUNT = 1
    BANK_ACCOUNT = 2
    SAVINGS_ACCOUNT = 3
    LOAN_ACCOUNT = 4

    def get_text(self):
        return {
            BankAccountType.MOBILE_MONEY_ACCOUNT: "MOBILE_MONEY_ACCOUNT",
            BankAccountType.BANK_ACCOUNT: "BANK_ACCOUNT",
            BankAccountType.SAVINGS_ACCOUNT: "SAVINGS_ACCOUNT",
            BankAccountType.LOAN_ACCOUNT: "LOAN_ACCOUNT",
        }[self]