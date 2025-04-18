import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


pytestmark = pytest.mark.django_db


class TestUserModel:
    def test_create_user(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        assert user.phone_number == "+254700000000"
        assert user.check_password("testpassword")
        assert not user.is_staff
        assert not user.is_admin

    def test_create_staff_user(self):
        staff_user = User.objects.create_staffuser(
            phone_number="+254700000000", password="staffpassword"
        )
        assert staff_user.phone_number == "+254700000000"
        assert staff_user.check_password("staffpassword")
        assert staff_user.is_staff
        assert not staff_user.is_admin

    def test_create_superuser(self):
        superuser = User.objects.create_superuser(
            phone_number="+254700000000", password="superpassword"
        )
        assert superuser.phone_number == "+254700000000"
        assert superuser.check_password("superpassword")
        assert superuser.is_staff
        assert superuser.is_admin

    def test_full_name_with_first_name_only(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        user.first_name = "John"
        user.save()
        assert user.get_full_name() == "John"

    def test_full_name_with_last_name_only(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        user.last_name = "Doe"
        user.save()
        assert user.get_full_name() == "Doe"

    def test_full_name_with_phone_number_only(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        user.save()
        assert user.get_full_name() == "+254700000000"

    def test_unconventional_phone_number(self):
        with pytest.raises(ValueError, match="Invalid phone number format"):
            User.objects.create_user(phone_number="0700000000", password="testpassword")

    def test_get_full_name(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        user.first_name = "John"
        user.last_name = "Doe"
        user.save()
        assert user.get_full_name() == "John Doe"

    def test_get_short_name(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        user.first_name = "John"
        user.last_name = "Doe"
        user.save()
        assert user.get_short_name() == "John"

    def test_get_short_name_first_name_only(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        user.first_name = "John"
        user.save()
        assert user.get_short_name() == "John"

    def test_get_short_name_last_name_only(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        user.last_name = "Doe"
        user.save()
        assert user.get_short_name() == "Doe"

    def test_get_short_name_phone_only(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        user.save()
        assert user.get_short_name() == "+254700000000"

    def test_str_representation(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        assert str(user) == "+254700000000"

    def test_user_permissions(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        assert user.has_perm(None)
        assert user.has_module_perms(None)

    def test_user_is_active(self):
        user = User.objects.create_user(
            phone_number="+254700000000", password="testpassword"
        )
        assert user.is_active
        user.active = False
        user.save()
        assert not user.is_active
