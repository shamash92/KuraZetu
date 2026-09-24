from datetime import timedelta

from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.urls import reverse
from django.utils import timezone

import pytest
from axes.models import AccessAttempt
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.authentication import issue_native_token
from accounts.models import NativeToken

User = get_user_model()
NUMBER = "+254700000001"
PASSWORD = "test-password-only"
# Shaped like a DRF token key: 40 hex characters.
DRF_TOKEN = "0123456789abcdef0123456789abcdef01234567"

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


def native_login(password=PASSWORD):
    return APIClient().post(
        reverse("native_login_api"),
        {"phone_number": NUMBER, "password": password},
        format="json",
    )


def session_status(token):
    return APIClient().get(reverse("native_session_api"), **bearer(token)).status_code


def test_each_account_keeps_one_hashed_native_token(user):
    issue_native_token(user)
    instance, token = issue_native_token(user)

    assert list(AuthToken.objects.filter(user=user)) == [instance]
    assert token not in instance.digest


def test_admin_shows_native_tokens_masked_and_cannot_mint_them(user, rf):
    issue_native_token(user)
    token = NativeToken.objects.get()
    token_admin = admin.site._registry[NativeToken]
    request = rf.get("/")

    # Headings, breadcrumbs, delete pages, and history all use str(token).
    assert str(token) == "+254700000XXX"
    assert NUMBER not in token_admin.masked_phone(token)
    assert "digest" not in token_admin.list_display
    assert not admin.site.is_registered(AuthToken)
    assert not token_admin.has_add_permission(request)
    assert not token_admin.has_change_permission(request)


def test_shared_views_accept_knox_tokens_and_reject_drf_tokens(user):
    knox_token = issue_native_token(user)[1]

    assert push_token_status(f"Bearer {knox_token}") == 200
    assert push_token_status(f"Token {DRF_TOKEN}") == 401


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


def test_native_login_issues_a_knox_token_and_no_web_session(user):
    response = native_login()

    assert response.status_code == 200
    assert response["Cache-Control"] == "no-store"
    assert response.data["data"]["expiry"]
    assert AuthToken.objects.filter(user=user).count() == 1
    assert settings.SESSION_COOKIE_NAME not in response.cookies
    assert not Session.objects.exists()
    assert session_status(response.data["data"]["token"]) == 200


def test_a_new_native_login_replaces_the_previous_token(user):
    first = native_login().data["data"]["token"]
    second = native_login().data["data"]["token"]

    assert session_status(first) == 401
    assert session_status(second) == 200


def test_unverified_account_gets_no_knox_token():
    User.objects.create_user(phone_number=NUMBER, password=PASSWORD)

    response = native_login()

    assert response.data["code"] == "phone_verification_required"
    assert not AuthToken.objects.exists()


def test_native_login_shares_the_password_lockout(user):
    for _ in range(4):
        assert native_login(password="wrong").status_code == 400
    native_login(password="wrong")

    response = native_login()

    assert response.status_code == 429
    assert response.json()["code"] == "login_temporarily_blocked"
    assert not AuthToken.objects.exists()


def test_native_login_resets_its_failure_counter_and_is_audited(user, monkeypatch):
    native_login(password="wrong")
    events = []
    monkeypatch.setattr(
        "accounts.signals.log_event",
        lambda request, event, **kwargs: events.append(event),
    )

    native_login()

    assert not AccessAttempt.objects.exists()
    assert events == ["auth.login_succeeded"]


def test_use_slides_the_expiry_but_never_past_thirty_days(user):
    token = native_login().data["data"]["token"]
    stored = AuthToken.objects.get(user=user)
    stored.created = timezone.now() - timedelta(days=29)
    stored.expiry = timezone.now() + timedelta(hours=1)
    stored.save()

    assert session_status(token) == 200

    stored.refresh_from_db()
    assert stored.expiry == stored.created + timedelta(days=30)


def test_expired_token_is_rejected_and_deleted(user):
    token = native_login().data["data"]["token"]
    AuthToken.objects.update(expiry=timezone.now() - timedelta(seconds=1))

    assert session_status(token) == 401
    assert not AuthToken.objects.exists()


def test_native_logout_revokes_the_token_and_keeps_web_sessions(user, client):
    client.force_login(user)
    token = native_login().data["data"]["token"]

    response = APIClient().post(reverse("native_logout_api"), **bearer(token))

    assert response.status_code == 204
    assert session_status(token) == 401
    assert Session.objects.count() == 1


def test_native_endpoints_reject_web_sessions_and_drf_tokens(user):
    api = APIClient()
    api.force_login(user)

    assert api.get(reverse("native_session_api")).status_code == 401
    assert (
        APIClient()
        .get(
            reverse("native_session_api"),
            HTTP_AUTHORIZATION=f"Token {DRF_TOKEN}",
        )
        .status_code
        == 401
    )
