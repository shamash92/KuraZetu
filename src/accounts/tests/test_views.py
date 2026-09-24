from django.contrib.auth import get_user_model
from django.contrib.staticfiles import finders
from django.urls import reverse

import pytest
from rest_framework.test import APIClient

User = get_user_model()

pytestmark = pytest.mark.django_db


class TestLoginView:
    def test_login_with_correct_credentials_succeeds(self):
        user = User.objects.create_user(
            phone_number="+254712345678", password="pw12345"
        )
        user.is_phone_verified = True
        user.save(update_fields=("is_phone_verified",))
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


def test_the_unverified_signup_route_is_gone():
    response = APIClient().post("/api/accounts/signup/", {}, format="json")

    assert response.status_code == 404


def test_legacy_password_reset_route_redirects_to_otp_flow(client):
    response = client.get(reverse("password_reset"))

    assert response.status_code == 302
    assert response["Location"] == "/ui/password-reset/"


class TestPushTokenView:
    def test_authenticated_user_can_update_their_push_token(self):
        user = User.objects.create_user(
            phone_number="+254712345678", password="pw12345"
        )
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post(
            reverse("push_token_api"),
            {"expo_push_token": "ExponentPushToken[example]"},
            format="json",
        )

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.expo_push_token == "ExponentPushToken[example]"

    def test_push_token_update_requires_authentication(self):
        response = APIClient().post(
            reverse("push_token_api"),
            {"expo_push_token": "ExponentPushToken[example]"},
            format="json",
        )

        assert response.status_code == 401

    def test_push_token_update_rejects_a_missing_token(self):
        user = User.objects.create_user(
            phone_number="+254712345678", password="pw12345"
        )
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post(reverse("push_token_api"), {}, format="json")

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


class TestBrandAssets:
    @pytest.mark.parametrize(
        "asset",
        [
            "images/logo/mark.svg",
            "images/logo/favicon.ico",
            "images/logo/icon.png",
            "images/logo/apple-touch-icon.png",
        ],
    )
    def test_the_logo_assets_ship_with_the_static_files(self, asset):
        assert finders.find(asset) is not None

    def test_the_pages_link_the_icons(self, client):
        content = client.get(reverse("login")).content.decode()

        assert 'rel="icon"' in content
        assert "static/images/logo/apple-touch-icon.png" in content
