from rest_framework.serializers import ModelSerializer

from accounts.models import User


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
