from zazi.core.enums import IntEnumChoices

class IdentityType(IntEnumChoices):
    PERSON = 1
    BUSINESS = 2

    def get_text(self):
        return {
            IdentityType.PERSON: "PERSON",
            IdentityType.BUSINESS: "BUSINESS"
        }[self]

class IdentityStatus(IntEnumChoices):
    UNVERIFIED = 1
    VERIFIED = 2

    def get_text(self):
        return {
            IdentityStatus.UNVERIFIED: "UNVERIFIED",
            IdentityStatus.VERIFIED: "VERIFIED"
        }[self]
