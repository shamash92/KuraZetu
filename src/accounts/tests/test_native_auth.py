from django.contrib import admin
from django.contrib.auth import get_user_model
from django.urls import reverse

import pytest
from knox.models import AuthToken
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.authentication import issue_native_token

User = get_user_model()
NUMBER = "+254700000001"
PASSWORD = "test-password-only"

pytestmark = pytest.mark.django_db


def verified_user(number=NUMBER):
    user = User.objects.create_user(phone_number=number, password=PASSWORD)
    user.is_phone_verified = True
    user.save(update_fields=("is_phone_verified",))
    return user


@pytest.fixture
def user():
    return verified_user()


def bearer(token):
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


def push_token_status(authorization):
    return (
        APIClient()
        .post(
            reverse("push_token_api"),
            {"expo_push_token": "ExponentPushToken[test]"},
            format="json",
            HTTP_AUTHORIZATION=authorization,
        )
        .status_code
    )


def test_each_account_keeps_one_hashed_native_token(user):
    issue_native_token(user)
    instance, token = issue_native_token(user)

    assert list(AuthToken.objects.filter(user=user)) == [instance]
    assert token not in instance.digest


def test_admin_lists_native_tokens_masked_and_cannot_mint_them(user, rf):
    issue_native_token(user)
    token_admin = admin.site._registry[AuthToken]
    request = rf.get("/")

    assert "digest" not in token_admin.list_display
    assert NUMBER not in token_admin.masked_phone(AuthToken.objects.get())
    assert not token_admin.has_add_permission(request)
    assert not token_admin.has_change_permission(request)


def test_shared_views_accept_knox_and_drf_tokens(user):
    knox_token = issue_native_token(user)[1]
    drf_token = Token.objects.create(user=user)

    assert push_token_status(f"Bearer {knox_token}") == 200
    assert push_token_status(f"Token {drf_token.key}") == 200


def test_authorization_header_wins_over_a_session_cookie(user):
    other = verified_user("+254700000002")
    token = issue_native_token(user)[1]
    api = APIClient()
    api.force_login(other)

    api.post(
        reverse("push_token_api"),
        {"expo_push_token": "ExponentPushToken[header]"},
        format="json",
        **bearer(token),
    )

    user.refresh_from_db()
    other.refresh_from_db()
    assert user.expo_push_token == "ExponentPushToken[header]"
    assert other.expo_push_token != "ExponentPushToken[header]"


def test_deactivated_account_cannot_use_its_knox_token(user):
    token = issue_native_token(user)[1]
    user.active = False
    user.save(update_fields=("active",))

    assert push_token_status(f"Bearer {token}") == 401
