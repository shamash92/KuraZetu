import re
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from django.urls import reverse
from django.utils import timezone

import pytest
from rest_framework.test import APIClient

from accounts.models import (
    PhoneVerificationChallenge,
    PhoneVerificationSend,
    PhoneVerificationTicket,
)
from accounts.phone_verification import (
    InvalidPhoneVerificationCode,
    PhoneVerificationRateLimited,
    fake_sms_gateway,
    start_verification,
    verify_code,
)
from stations.models import Constituency, County, PollingCenter, Ward

User = get_user_model()
NUMBER = "+254700000001"

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def clear_fake_sms_gateway():
    fake_sms_gateway.clear()
    yield
    fake_sms_gateway.clear()


@pytest.fixture
def otp_request():
    return RequestFactory().post("/", REMOTE_ADDR="192.0.2.1")


@pytest.fixture
def polling_center():
    county = County.objects.create(name="OTP County", number=201)
    constituency = Constituency.objects.create(
        name="OTP Constituency", county=county, number=201
    )
    ward = Ward.objects.create(name="OTP Ward", constituency=constituency, number=201)
    return PollingCenter.objects.create(name="OTP Center", code="201", ward=ward)


def latest_code():
    message = fake_sms_gateway.sent_messages[-1]["message"]
    return re.search(r"code: (\d{6})", message).group(1)


def start_signup_verification(otp_request):
    return start_verification(
        phone_number=NUMBER,
        purpose=PhoneVerificationChallenge.Purpose.SIGNUP,
        request=otp_request,
    )


def test_fake_gateway_records_one_single_part_otp_without_persisting_the_code(
    otp_request,
):
    start_signup_verification(otp_request)

    code = latest_code()
    challenge = PhoneVerificationChallenge.objects.get()
    assert len(fake_sms_gateway.sent_messages) == 1
    assert fake_sms_gateway.sent_messages[-1]["message"] == (
        f"<#> Kura Zetu code: {code}\nDo not share this code."
    )
    assert challenge.code_digest != code
    assert code not in challenge.code_digest


def test_resend_cooldown_then_three_send_cap(otp_request):
    start_signup_verification(otp_request)

    with pytest.raises(PhoneVerificationRateLimited) as error:
        start_signup_verification(otp_request)
    assert error.value.code == "phone_verification_resend_cooldown"
    assert 1 <= error.value.retry_after_seconds <= 30

    PhoneVerificationSend.objects.update(
        created_at=timezone.now() - timedelta(seconds=31)
    )
    start_signup_verification(otp_request)
    PhoneVerificationSend.objects.update(
        created_at=timezone.now() - timedelta(seconds=31)
    )
    start_signup_verification(otp_request)

    with pytest.raises(PhoneVerificationRateLimited) as error:
        start_signup_verification(otp_request)
    assert error.value.code == "phone_verification_rate_limited"
    assert PhoneVerificationSend.objects.count() == 3


def test_expired_code_does_not_consume_wrong_code_attempts(otp_request):
    verification = start_signup_verification(otp_request)
    code = latest_code()
    challenge = PhoneVerificationChallenge.objects.get()
    challenge.expires_at = timezone.now() - timedelta(seconds=1)
    challenge.save(update_fields=("expires_at",))

    with pytest.raises(InvalidPhoneVerificationCode):
        verify_code(challenge_id=verification.challenge_id, code=code)

    challenge.refresh_from_db()
    assert challenge.failed_attempts == 0
    assert challenge.locked_until is None


def test_three_wrong_codes_lock_the_phone_and_purpose(otp_request):
    verification = start_signup_verification(otp_request)
    wrong_code = "999999" if latest_code() != "999999" else "888888"

    for _ in range(3):
        with pytest.raises(InvalidPhoneVerificationCode):
            verify_code(challenge_id=verification.challenge_id, code=wrong_code)

    challenge = PhoneVerificationChallenge.objects.get()
    assert challenge.code_digest == ""
    assert challenge.locked_until > timezone.now()
    with pytest.raises(PhoneVerificationRateLimited) as error:
        start_signup_verification(otp_request)
    assert error.value.code == "phone_verification_temporarily_blocked"


def test_password_reset_request_is_generic_and_sends_for_an_unknown_number():
    response = APIClient().post(
        reverse("password_reset_phone_verification_start_api"),
        {"phone_number": NUMBER},
        format="json",
    )

    assert response.status_code == 202
    assert response.data["message"] == (
        "If this number can receive messages, a code is on its way."
    )
    assert len(fake_sms_gateway.sent_messages) == 1


def test_verified_signup_ticket_creates_a_phone_verified_user_once(polling_center):
    client = APIClient()
    start = client.post(
        reverse("signup_phone_verification_start_api"),
        {"phone_number": NUMBER},
        format="json",
    )
    code = latest_code()
    verified = client.post(
        reverse("phone_verification_code_api"),
        {"challenge_id": start.data["data"]["challenge_id"], "code": code},
        format="json",
    )
    payload = {
        "verification_ticket": verified.data["data"]["verification_ticket"],
        "password": "A-long-unique-password-123!",
        "ward_code": str(polling_center.ward.number),
        "polling_center": polling_center.code,
        "first_name": "Test",
        "last_name": "Voter",
        "age": 30,
        "gender": "F",
        "role": "voter",
    }

    response = client.post(reverse("signup_completion_api"), payload, format="json")

    assert response.status_code == 201
    assert response.data["data"]["token"]
    user = User.objects.get(phone_number=NUMBER)
    assert user.is_phone_verified is True
    assert user.polling_center == polling_center
    assert (
        client.post(
            reverse("signup_completion_api"), payload, format="json"
        ).status_code
        == 400
    )


def test_verified_signup_code_for_existing_user_returns_existing_account():
    User.objects.create_user(
        phone_number=NUMBER,
        password="Old-long-unique-password-123!",
    )
    client = APIClient()
    start = client.post(
        reverse("signup_phone_verification_start_api"),
        {"phone_number": NUMBER},
        format="json",
    )

    verified = client.post(
        reverse("phone_verification_code_api"),
        {"challenge_id": start.data["data"]["challenge_id"], "code": latest_code()},
        format="json",
    )

    assert verified.status_code == 200
    assert verified.data["data"] == {"outcome": "existing_account"}
    assert PhoneVerificationTicket.objects.count() == 0
    challenge = PhoneVerificationChallenge.objects.get()
    assert challenge.code_digest == ""


def test_verified_reset_ticket_changes_the_existing_password():
    user = User.objects.create_user(
        phone_number=NUMBER,
        password="Old-long-unique-password-123!",
    )
    client = APIClient()
    start = client.post(
        reverse("password_reset_phone_verification_start_api"),
        {"phone_number": NUMBER},
        format="json",
    )
    verified = client.post(
        reverse("phone_verification_code_api"),
        {"challenge_id": start.data["data"]["challenge_id"], "code": latest_code()},
        format="json",
    )

    response = client.post(
        reverse("password_reset_completion_api"),
        {
            "verification_ticket": verified.data["data"]["verification_ticket"],
            "new_password": "New-long-unique-password-123!",
        },
        format="json",
    )

    assert response.status_code == 200
    user.refresh_from_db()
    assert user.check_password("New-long-unique-password-123!")
