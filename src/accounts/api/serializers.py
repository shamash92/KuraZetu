from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework.serializers import ModelSerializer, Serializer

from accounts.models import User


class PhoneNumberSerializer(Serializer):
    number = PhoneNumberField(required=True)


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
            "active",
            "staff",
            "admin",
        )
        # Authority and status are assigned by the server, never by clients.
        read_only_fields = ("is_verified", "active", "staff", "admin")
