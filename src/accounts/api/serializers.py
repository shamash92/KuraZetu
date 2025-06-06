from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework.serializers import ModelSerializer, Serializer

from accounts.models import User


class PhoneNumberSerializer(Serializer):
    number = PhoneNumberField(region="KE", required=True)


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
