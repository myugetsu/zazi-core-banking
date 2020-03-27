from zazi.core.enums import IntEnumChoices

class EntryType(IntEnumChoices):
    DEBIT = 0
    CREDIT = 1
    
    def get_text(self):
        return 'DEBIT' if self == EntryType.DEBIT else 'CREDIT'