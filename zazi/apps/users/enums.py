from zazi.core.enums import IntEnumChoices

class UserStatus(IntEnumChoices):
    BANNED = -1
    #----------
    REQUESTED_MEMBERSHIP = 0
    VERIFIED = 1
    APPROVED = 2


class UserType(IntEnumChoices):
    ADMINISTRATOR = 1
    LOANEE = 2