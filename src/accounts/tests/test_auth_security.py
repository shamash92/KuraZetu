import json
import logging
from datetime import timedelta
from logging.handlers import WatchedFileHandler

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.urls import reverse
from django.utils import timezone

import pytest
from axes.models import AccessAttempt, AccessFailureLog, AccessLog
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.auth_security import account_reference, client_ip
from CommunityTally.logging_utils.formatters import JSONFormatter
from CommunityTally.logging_utils.redaction import RedactionFilter
from CommunityTally.logging_utils.request_id import RequestContextFilter

User = get_user_model()
NUMBER = "+254700000001"
PASSWORD = "test-password-only"


@pytest.fixture
def user(db):
    created_user = User.objects.create_user(phone_number=NUMBER, password=PASSWORD)
    created_user.is_phone_verified = True
    created_user.save(update_fields=("is_phone_verified",))
    return created_user


def api_login(client, number=NUMBER, password="wrong", **headers):
    return client.post(
        reverse("native_login_api"),
        {"phone_number": number, "password": password},
        format="json",
        **headers,
    )


@pytest.fixture
def audit_file(tmp_path):
    path = tmp_path / "auth_logs.log"
    handler = WatchedFileHandler(path, encoding="utf-8")
    handler.setFormatter(JSONFormatter())
    handler.addFilter(RedactionFilter())
    handler.addFilter(RequestContextFilter())
    logger = logging.getLogger("accounts.security")
    logger.addHandler(handler)
    yield path
    logger.removeHandler(handler)
    handler.close()


def test_web_and_api_share_counter_and_expiry(user, client):
    api = APIClient()
    for number in [NUMBER, "0700000001", "254700000001"]:
        assert api_login(api, number).status_code == 400
    response = client.post(
        reverse("login"), {"phone_number": NUMBER, "password": "wrong"}
    )
    assert response.status_code == 200
    assert AccessAttempt.objects.get().failures_since_start == 4

    response = api_login(api)
    assert response.status_code == 429
    assert response.json()["code"] == "login_temporarily_blocked"
    assert response.json()["retry_after_seconds"] == int(response["Retry-After"])
    assert 1 <= int(response["Retry-After"]) <= 900
    assert not AuthToken.objects.filter(user=user).exists()
    assert api_login(api, password=PASSWORD).status_code == 429
    response = client.post(
        reverse("login"), {"phone_number": NUMBER, "password": PASSWORD}
    )
    assert response.status_code == 429
    assert b"Too many failed login attempts" in response.content
    assert b'role="alert"' in response.content
    assert "_auth_user_id" not in client.session

    # A blocked retry cannot move the deadline forward, even with a good password.
    frozen = timezone.now() - timedelta(minutes=10)
    AccessAttempt.objects.update(attempt_time=frozen)
    response = api_login(api, password=PASSWORD)
    assert 1 <= int(response["Retry-After"]) <= 300
    assert AccessAttempt.objects.get().attempt_time == frozen
    assert AccessAttempt.objects.get().failures_since_start == 5

    AccessAttempt.objects.update(attempt_time=timezone.now() - timedelta(minutes=16))
    assert api_login(api, password=PASSWORD).status_code == 200
    assert not AccessAttempt.objects.exists()


def test_shared_ip_does_not_lock_other_account_and_ip_change_is_separate(user):
    api = APIClient()
    for _ in range(5):
        api_login(api)
    other = User.objects.create_user(phone_number="+254700000002", password=PASSWORD)
    other.is_phone_verified = True
    other.save(update_fields=("is_phone_verified",))
    assert api_login(api, str(other.phone_number), PASSWORD).status_code == 200
    assert api_login(api, password=PASSWORD, REMOTE_ADDR="192.0.2.2").status_code == 200
    assert api_login(api, password=PASSWORD).status_code == 429


def test_success_resets_only_its_counter_and_emits_one_event(user, client, audit_file):
    api = APIClient()
    api_login(api, REMOTE_ADDR="192.0.2.2")
    api_login(api)
    response = client.post(
        reverse("login"), {"phone_number": NUMBER, "password": PASSWORD}
    )
    assert response.status_code == 302
    assert AccessAttempt.objects.count() == 1
    assert AccessAttempt.objects.get().ip_address == "192.0.2.2"
    records = [json.loads(line) for line in audit_file.read_text().splitlines()]
    successes = [r for r in records if r["event"] == "auth.login_succeeded"]
    assert len(successes) == 1
    assert successes[0]["user_id"] == user.pk
    assert successes[0]["client_ip"] == "127.0.0.1"
    assert successes[0]["request_id"] == response["X-Request-ID"]


@pytest.mark.django_db
def test_unknown_accounts_are_counted_and_client_headers_cannot_bypass(audit_file):
    api = APIClient()
    for index in range(6):
        response = api_login(
            api,
            HTTP_USER_AGENT=f"Different-client-{index}",
            HTTP_X_FORWARDED_FOR=f"192.0.2.{index + 1}",
            HTTP_X_APP_PLATFORM="android",
        )
    assert response.status_code == 429
    assert AccessAttempt.objects.count() == 1
    records = [json.loads(line) for line in audit_file.read_text().splitlines()]
    assert len(records) == 6
    assert [r["event"] for r in records] == ["auth.login_failed"] * 4 + [
        "auth.login_blocked"
    ] * 2
    assert all(r["client_ip"] == "127.0.0.1" for r in records)


def test_sensitive_input_is_not_stored_in_axes_or_auth_log(user, client, audit_file):
    client.post(
        reverse("login") + "?private=do-not-store-query",
        {
            "phone_number": NUMBER,
            "password": "do-not-store-password",
            "otp": "do-not-store-otp",
            "arbitrary": "do-not-store-field",
        },
        HTTP_USER_AGENT="do-not-store-agent",
        HTTP_ACCEPT="do-not-store-accept",
    )
    attempt = AccessAttempt.objects.get()
    assert attempt.username != NUMBER
    assert len(attempt.username) == 64
    assert attempt.post_data == attempt.get_data == ""
    assert attempt.user_agent == attempt.http_accept == attempt.path_info == ""
    assert not AccessLog.objects.exists()
    assert not AccessFailureLog.objects.exists()
    content = audit_file.read_text()
    assert NUMBER not in content
    assert "do-not-store" not in content


@pytest.mark.parametrize("route", ["admin:login", "rest_framework:login"])
def test_other_password_entry_points_cannot_bypass_lockout(user, client, route):
    for _ in range(5):
        client.post(reverse(route), {"username": NUMBER, "password": "wrong"})
    assert AccessAttempt.objects.get().failures_since_start == 5
    assert api_login(APIClient(), password=PASSWORD).status_code == 429


@pytest.mark.django_db
@pytest.mark.parametrize("payload", [{}, [], {"phone_number": NUMBER, "password": 1}])
def test_malformed_api_input_is_rejected_without_a_server_error(payload):
    response = APIClient().post(reverse("native_login_api"), payload, format="json")
    assert response.status_code == 400
    assert not AccessAttempt.objects.exists()


def test_forwarded_ip_requires_a_trusted_peer_and_single_valid_address(rf, settings):
    settings.AUTH_CLIENT_IP_HEADER = "HTTP_X_REAL_IP"
    settings.AUTH_TRUSTED_PROXY_NETWORKS = ["192.0.2.0/24"]
    request = rf.post("/", REMOTE_ADDR="198.51.100.1", HTTP_X_REAL_IP="203.0.113.2")
    assert client_ip(request) == "198.51.100.1"
    request.META["REMOTE_ADDR"] = "192.0.2.5"
    assert client_ip(request) == "203.0.113.2"
    request.META["HTTP_X_REAL_IP"] = "2001:db8::1"
    assert client_ip(request) == "2001:db8::1"
    request.META["HTTP_X_REAL_IP"] = "203.0.113.2, 198.51.100.1"
    assert client_ip(request) == "192.0.2.5"


def test_account_reference_normalizes_without_exposing_number(rf):
    request = rf.post("/")
    refs = {
        account_reference(request, {"username": number})
        for number in [NUMBER, "0700000001", "254700000001"]
    }
    assert len(refs) == 1
    assert NUMBER not in refs


@pytest.mark.django_db
def test_scheduled_cleanup_preserves_current_lockouts():
    for suffix, age in [("expired", 16), ("current", 10)]:
        AccessAttempt.objects.create(
            username=suffix,
            ip_address="192.0.2.1",
            user_agent="",
            failures_since_start=5,
        )
        AccessAttempt.objects.filter(username=suffix).update(
            attempt_time=timezone.now() - timedelta(minutes=age)
        )
    call_command("purge_auth_attempts")
    assert list(AccessAttempt.objects.values_list("username", flat=True)) == ["current"]
