from django.contrib.auth import get_user_model
from django.contrib.staticfiles import finders
from django.urls import reverse

import pytest
from rest_framework.test import APIClient

from stations.models import Constituency, County, PollingCenter, Ward

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture
def polling_center():
    county = County.objects.create(name="Test County", number=1)
    constituency = Constituency.objects.create(
        name="Test Constituency", county=county, number=1
    )
    ward = Ward.objects.create(name="Test Ward", constituency=constituency, number=1001)
    return PollingCenter.objects.create(
        name="Test Polling Center", code="099", ward=ward
    )


class TestSignupView:
    def _payload(self, polling_center, **overrides):
        data = {
            "phone_number": "+254700000001",
            "password": "pw12345",
            "confirm_password": "pw12345",
            "first_name": "Jane",
            "last_name": "Doe",
            "age": 30,
            "gender": "F",
            "role": "observer",
            "polling_center": polling_center.code,
        }
        data.update(overrides)
        return {"ward_code": polling_center.ward.number, "data": data}

    def test_signup_succeeds_with_identity_fields(self, polling_center):
        client = APIClient()
        response = client.post(
            reverse("signup_api"), self._payload(polling_center), format="json"
        )
        assert response.status_code == 201
        assert "token" in response.data["data"]
        user = User.objects.get(phone_number="+254700000001")
        assert user.polling_center == polling_center
        assert user.role == "observer"

    def test_signup_cannot_set_authority_fields(self, polling_center):
        client = APIClient()
        response = client.post(
            reverse("signup_api"),
            self._payload(
                polling_center,
                staff=True,
                admin=True,
                is_verified=True,
            ),
            format="json",
        )
        assert response.status_code == 201
        user = User.objects.get(phone_number="+254700000001")
        assert user.staff is False
        assert user.admin is False
        assert user.is_verified is False
        assert user.active is True

    def test_signup_cannot_deactivate_self(self, polling_center):
        client = APIClient()
        response = client.post(
            reverse("signup_api"),
            self._payload(polling_center, active=False),
            format="json",
        )
        assert response.status_code == 201
        user = User.objects.get(phone_number="+254700000001")
        assert user.active is True

    def test_signup_rejects_an_unknown_polling_center(self, polling_center):
        client = APIClient()
        payload = self._payload(polling_center)
        payload["data"]["polling_center"] = "999"
        response = client.post(
            reverse("signup_api"),
            payload,
            format="json",
        )
        assert response.data["error"] == "Polling center not found"
        assert not User.objects.filter(phone_number="+254700000001").exists()


class TestLoginView:
    def test_login_with_correct_credentials_succeeds(self):
        User.objects.create_user(phone_number="+254712345678", password="pw12345")
        client = APIClient()
        response = client.post(
            reverse("login_api"),
            {"phone_number": "+254712345678", "password": "pw12345"},
        )
        assert response.status_code == 200
        assert "token" in response.data["data"]

    def test_login_with_wrong_password_fails(self):
        User.objects.create_user(phone_number="+254712345678", password="pw12345")
        client = APIClient()
        response = client.post(
            reverse("login_api"),
            {"phone_number": "+254712345678", "password": "wrongpw"},
        )
        assert response.status_code == 400


class TestSocialCard:
    def test_the_card_asset_ships_with_the_static_files(self):
        assert finders.find("images/social/social-site.png") is not None

    def test_the_login_page_points_at_the_card(self, client):
        response = client.get(reverse("login"))

        content = response.content.decode()
        assert 'content="summary_large_image"' in content
        assert content.count("static/images/social/social-site.png") == 2
        assert "static/images/logo/icon.png" not in content
