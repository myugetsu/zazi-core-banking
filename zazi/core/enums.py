from enum import Enum

class BaseEnum(Enum):
    @classmethod
    def choices(cls):
        return tuple([(item.value, item.name) for item in cls])

class StrEnumChoices(str, BaseEnum):
    """Enum where members are also (and must be) strs"""

    def __str__(self):
        return self.value

class IntEnumChoices(int, BaseEnum):
    """Enum where members are also (and must be) ints"""


class TransactionStatus(IntEnumChoices):
    PENDING_PROCESSING_APPROVAL = 0
    
    PENDING_PROCESSING = 1
    COMPLETED_PROCESSING = 3
    FAILED_PROCESSING = 2
    
    PENDING_POSTING_TO_LEDGER = 4
    POSTED_TO_LEDGER = 5

    CANCELLED = 6
    FLAGGED = 7


class EntryType(IntEnumChoices):
    DEBIT = 0
    CREDIT = 1