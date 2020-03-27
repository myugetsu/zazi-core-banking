from django.db import models

from zazi.core.utils import generate_id
from zazi.core.base import BaseModel

from .enums import IdentityType, IdentityStatus


class Identity(BaseModel):
    identity_id = models.CharField(max_length=100, default=generate_id)

    first_name = models.CharField(max_length=150, null=True)
    middle_name = models.CharField(max_length=150, null=True)
    last_name = models.CharField(max_length=150, null=True)
    phone_number = models.CharField(max_length=150, null=True)

    identity_type = models.PositiveSmallIntegerField(choices=IdentityType.choices(), null=True)
    status = models.PositiveSmallIntegerField(choices=IdentityStatus.choices(), null=True)

    user_account = models.ForeignKey('users.UserAccount', models.CASCADE, null=True, related_name='identities')

    class Meta:
        db_table = "identity"

    def __str__(self):
        return f"#{self.identity_id}: {self.phone_number} - status: {self.status and IdentityStatus(self.status).get_text()}"

    @property
    def has_captured_names(self):
        return not (
            self.first_name is None or
            self.middle_name is None or
            self.last_name is None
        )

    def as_dict(self):
        return dict(
            identity_id=self.identity_id,
            first_name=(self.first_name or ""),
            middle_name=(self.middle_name or ""),
            last_name=(self.last_name or ""),
            full_name=(" ".join([(self.first_name or ""), (self.middle_name or ""), (self.last_name or "")])).strip(),
            phone_number=self.phone_number,
            identity_type=IdentityType(self.identity_type or IdentityType.PERSON).get_text(),
            status=IdentityStatus(self.status or IdentityStatus.UNVERIFIED).get_text())


class MpesaIdentityVerification(BaseModel):
    identity = models.ForeignKey('Identity', models.CASCADE)

    mpesa_transaction = models.ForeignKey('mpesa.MpesaTransaction', models.SET_NULL, null=True)

    initiated_at = models.DateTimeField(null=True)
    processed_at = models.DateTimeField(null=True)

    validated_at = models.DateTimeField(null=True)

    class Meta:
        db_table = "mpesa_identity_verification"