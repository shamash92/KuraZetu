from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework.exceptions import ValidationError
from rest_framework.serializers import (
    CharField,
    ChoiceField,
    ModelSerializer,
    Serializer,
    UUIDField,
)

from accounts.models import User


class PhoneNumberSerializer(Serializer):
    number = PhoneNumberField(required=True)


class PhoneVerificationStartSerializer(Serializer):
    phone_number = PhoneNumberField(required=True)


class PhoneVerificationCodeSerializer(Serializer):
    challenge_id = UUIDField(required=True)
    code = CharField(min_length=6, max_length=6, required=True)

    def validate_code(self, value):
        if not value.isdigit():
            raise ValidationError("Enter the six-digit code.")
        return value


class SignupCompletionSerializer(ModelSerializer):
    verification_ticket = CharField(min_length=32, max_length=128, write_only=True)
    password = CharField(write_only=True)
    ward_code = CharField(write_only=True)
    polling_center = CharField(max_length=8, write_only=True)
    # The Native app asks for a Knox token instead of a web session.
    client = ChoiceField(choices=("native",), required=False, write_only=True)

    class Meta:
        model = User
        fields = (
            "verification_ticket",
            "client",
            "password",
            "ward_code",
            "polling_center",
            "age",
            "gender",
            "role",
            "first_name",
            "last_name",
        )

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as error:
            raise ValidationError(error.messages) from error
        return value


class PasswordResetCompletionSerializer(Serializer):
    verification_ticket = CharField(min_length=32, max_length=128, write_only=True)
    new_password = CharField(write_only=True)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as error:
            raise ValidationError(error.messages) from error
        return value


class SignupSerializer(ModelSerializer):
    """
    Serializer for the public signup endpoint.

    Identity fields only: authority and status fields (staff, admin, active,
    is_verified) are server-controlled and must never be writable through a
    public endpoint. The polling centre is not accepted here either; the view
    resolves it from its code and ward and assigns it explicitly.
    """

    class Meta:
        model = User
        fields = (
            "phone_number",
            "age",
            "gender",
            "role",
            "first_name",
            "last_name",
        )


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = (
            "phone_number",
            "id_number",
            "age",
            "gender",
            "role",
            "first_name",
            "last_name",
            "polling_center",
            "is_verified",
            "is_phone_verified",
            "active",
            "staff",
            "admin",
        )
        # Authority and status are assigned by the server, never by clients.
        read_only_fields = (
            "is_verified",
            "is_phone_verified",
            "active",
            "staff",
            "admin",
        )
