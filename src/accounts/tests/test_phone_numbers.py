from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError
from django.test import override_settings

import pytest

from accounts.api.serializers import PhoneNumberSerializer

User = get_user_model()

# Local and international spellings of the same Kenyan number.
EQUIVALENT = ["+254712345678", "254712345678", "0712345678"]


class TestPhoneNumberSerializer:
    """The serializer no longer passes region explicitly and relies on
    PHONENUMBER_DEFAULT_REGION, so these cover what that kwarg used to do."""

    @pytest.mark.parametrize("number", EQUIVALENT)
    def test_accepts_and_normalises_kenyan_numbers(self, number):
        serializer = PhoneNumberSerializer(data={"number": number})

        assert serializer.is_valid(), serializer.errors
        assert str(serializer.validated_data["number"]) == "+254712345678"

    def test_accepts_an_international_number(self):
        serializer = PhoneNumberSerializer(data={"number": "+14155552671"})

        assert serializer.is_valid(), serializer.errors
        assert str(serializer.validated_data["number"]) == "+14155552671"

    def test_rejects_a_number_that_is_not_a_number(self):
        serializer = PhoneNumberSerializer(data={"number": "not-a-phone"})

        assert not serializer.is_valid()

    @override_settings(PHONENUMBER_DEFAULT_REGION=None)
    def test_local_form_depends_on_the_default_region(self):
        """Guards the setting itself: drop it and the local form stops
        working, which is exactly what removing region="KE" would have done
        had the setting not been added."""
        serializer = PhoneNumberSerializer(data={"number": "0712345678"})

        assert not serializer.is_valid()


@pytest.mark.django_db
class TestCreateUserPhoneNumbers:
    @pytest.mark.parametrize("number", EQUIVALENT)
    def test_stores_every_spelling_in_the_same_form(self, number):
        user = User.objects.create_user(phone_number=number, password="pw")

        assert str(user.phone_number) == "+254712345678"

    @pytest.mark.parametrize("attempt", EQUIVALENT)
    def test_login_works_with_any_spelling_of_the_stored_number(self, attempt):
        """The account is stored as +254712345678. Before the default region
        was set, only that exact spelling authenticated, so the login endpoint
        could accept a number as valid and then reject the credentials."""
        User.objects.create_user(phone_number="+254712345678", password="pw12345")

        assert authenticate(username=attempt, password="pw12345") is not None

    def test_rejects_an_unparseable_number_with_guidance(self):
        with pytest.raises(ValidationError) as excinfo:
            User.objects.create_user(phone_number="12", password="pw")

        message = excinfo.value.messages[0]
        assert "+254712345678" in message
        assert "0712345678" in message
