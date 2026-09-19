"""Server-owned phone verification challenges, tickets, and SMS delivery."""

import math
import secrets
from collections import deque
from dataclasses import dataclass
from datetime import timedelta
from threading import Lock

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac

from accounts.auth_security import client_ip
from accounts.models import (
    PhoneVerificationChallenge,
    PhoneVerificationRateScope,
    PhoneVerificationSend,
    PhoneVerificationTicket,
    User,
)

PASSWORD_RESET_PHONE_NUMBER_SESSION_KEY = "password_reset_phone_number"


class PhoneVerificationError(Exception):
    pass


class PhoneVerificationRateLimited(PhoneVerificationError):
    def __init__(self, retry_after_seconds, code):
        self.retry_after_seconds = retry_after_seconds
        self.code = code


class InvalidPhoneVerificationCode(PhoneVerificationError):
    pass


class InvalidPhoneVerificationTicket(PhoneVerificationError):
    pass


class SmsDeliveryUnavailable(PhoneVerificationError):
    pass


@dataclass(frozen=True)
class VerificationStart:
    challenge_id: str
    expires_in_seconds: int
    retry_after_seconds: int


@dataclass(frozen=True)
class VerificationResult:
    token: str | None = None
    expires_in_seconds: int | None = None
    existing_account: bool = False


@dataclass(frozen=True)
class SmsDelivery:
    provider_message_id: str = ""


class FakeSmsGateway:
    """In-memory fake for development and tests; it never logs or persists SMS."""

    def __init__(self):
        # This deliberately keeps only a small, process-local test/dev window.
        self.sent_messages = deque(maxlen=100)

    def send(self, phone_number, message):
        self.sent_messages.append(
            {"phone_number": str(phone_number), "message": message}
        )
        return SmsDelivery()

    def clear(self):
        self.sent_messages.clear()


fake_sms_gateway = FakeSmsGateway()


class AfricasTalkingSmsGateway:
    def send(self, phone_number, message):
        try:
            import africastalking
        except ImportError as error:
            raise SmsDeliveryUnavailable() from error

        try:
            _initialize_africas_talking(africastalking)
            result = africastalking.SMS.send(message, [str(phone_number)])
            recipient = result["SMSMessageData"]["Recipients"][0]
        except Exception as error:
            raise SmsDeliveryUnavailable() from error

        if recipient.get("status") != "Success":
            raise SmsDeliveryUnavailable()
        return SmsDelivery(provider_message_id=recipient.get("messageId", ""))


africas_talking_initialization_lock = Lock()
africas_talking_initialized = False


def _initialize_africas_talking(africastalking):
    global africas_talking_initialized
    with africas_talking_initialization_lock:
        if not africas_talking_initialized:
            africastalking.initialize(settings.OTP_AT_USERNAME, settings.OTP_AT_API_KEY)
            africas_talking_initialized = True


def sms_gateway():
    if settings.OTP_SMS_BACKEND == "fake":
        return fake_sms_gateway
    if settings.OTP_SMS_BACKEND == "africastalking":
        return AfricasTalkingSmsGateway()
    raise SmsDeliveryUnavailable()


def sms_message(code):
    lines = ["<#> Kura Zetu code: " + code, "Do not share this code."]
    if settings.OTP_ANDROID_SMS_RETRIEVER_HASH:
        lines.append(settings.OTP_ANDROID_SMS_RETRIEVER_HASH)
    return "\n".join(lines)


def phone_reference(phone_number):
    return _reference("accounts.phone-verification.phone", str(phone_number))


def _reference(namespace, value):
    return salted_hmac(namespace, value, algorithm="sha256").hexdigest()


def _code_digest(challenge_id, code):
    return _reference("accounts.phone-verification.code", f"{challenge_id}:{code}")


def _ticket_digest(token):
    return _reference("accounts.phone-verification.ticket", token)


def _retry_after(deadline):
    remaining = deadline - timezone.now()
    return max(1, math.ceil(remaining.total_seconds()))


def _scope_for_update(kind, reference, purpose):
    PhoneVerificationRateScope.objects.get_or_create(
        kind=kind,
        reference=reference,
        purpose=purpose,
    )
    return PhoneVerificationRateScope.objects.select_for_update().get(
        kind=kind,
        reference=reference,
        purpose=purpose,
    )


def _new_code():
    return str(secrets.randbelow(10**settings.OTP_CODE_LENGTH)).zfill(
        settings.OTP_CODE_LENGTH
    )


def start_verification(*, phone_number, purpose, request, user=None, send_sms=True):
    """Create or replace the active OTP after atomically applying all limits."""
    now = timezone.now()
    phone_ref = phone_reference(phone_number)
    ip_ref = _reference(
        "accounts.phone-verification.ip", client_ip(request) or "unknown"
    )
    window_start = now - timedelta(seconds=settings.OTP_SEND_WINDOW_SECONDS)

    with transaction.atomic():
        # Lock in a stable order so concurrent requests cannot overrun either cap.
        ip_scope = _scope_for_update(PhoneVerificationRateScope.Kind.IP, ip_ref, "")
        phone_scope = _scope_for_update(
            PhoneVerificationRateScope.Kind.PHONE, phone_ref, purpose
        )
        PhoneVerificationRateScope.objects.filter(
            pk__in=(ip_scope.pk, phone_scope.pk)
        ).update(updated_at=now)
        (
            challenge,
            _,
        ) = PhoneVerificationChallenge.objects.select_for_update().get_or_create(
            phone_number=phone_number,
            purpose=purpose,
            defaults={"user": user},
        )
        if user is not None and challenge.user_id != user.id:
            challenge.user = user

        if challenge.locked_until and challenge.locked_until > now:
            raise PhoneVerificationRateLimited(
                _retry_after(challenge.locked_until),
                "phone_verification_temporarily_blocked",
            )

        recent_sends = PhoneVerificationSend.objects.filter(
            created_at__gte=window_start
        )
        phone_sends = recent_sends.filter(phone_reference=phone_ref, purpose=purpose)
        if phone_sends.count() >= settings.OTP_SEND_LIMIT:
            oldest = phone_sends.order_by("created_at").first()
            raise PhoneVerificationRateLimited(
                _retry_after(
                    oldest.created_at
                    + timedelta(seconds=settings.OTP_SEND_WINDOW_SECONDS)
                ),
                "phone_verification_rate_limited",
            )
        ip_sends = recent_sends.filter(client_ip_reference=ip_ref)
        if ip_sends.count() >= settings.OTP_IP_SEND_LIMIT:
            oldest = ip_sends.order_by("created_at").first()
            raise PhoneVerificationRateLimited(
                _retry_after(
                    oldest.created_at
                    + timedelta(seconds=settings.OTP_SEND_WINDOW_SECONDS)
                ),
                "phone_verification_rate_limited",
            )

        latest_send = phone_sends.order_by("-created_at").first()
        if latest_send:
            resend_at = latest_send.created_at + timedelta(
                seconds=settings.OTP_RESEND_COOLDOWN_SECONDS
            )
            if resend_at > now:
                raise PhoneVerificationRateLimited(
                    _retry_after(resend_at), "phone_verification_resend_cooldown"
                )

        code = _new_code()
        challenge.code_digest = _code_digest(challenge.pk, code)
        challenge.expires_at = now + timedelta(seconds=settings.OTP_CODE_TTL_SECONDS)
        challenge.failed_attempts = 0
        challenge.locked_until = None
        challenge.save(
            update_fields=(
                "user",
                "code_digest",
                "expires_at",
                "failed_attempts",
                "locked_until",
                "updated_at",
            )
        )
        send = PhoneVerificationSend.objects.create(
            challenge=challenge,
            purpose=purpose,
            phone_reference=phone_ref,
            client_ip_reference=ip_ref,
            outcome=(
                PhoneVerificationSend.Outcome.PENDING
                if send_sms
                else PhoneVerificationSend.Outcome.SUPPRESSED
            ),
        )

    if send_sms:
        try:
            delivery = sms_gateway().send(phone_number, sms_message(code))
        except SmsDeliveryUnavailable:
            send.outcome = PhoneVerificationSend.Outcome.FAILED
            send.save(update_fields=("outcome",))
            raise
        send.outcome = PhoneVerificationSend.Outcome.ACCEPTED
        send.provider_message_id = delivery.provider_message_id
        send.save(update_fields=("outcome", "provider_message_id"))

    return VerificationStart(
        challenge_id=str(challenge.pk),
        expires_in_seconds=settings.OTP_CODE_TTL_SECONDS,
        retry_after_seconds=settings.OTP_RESEND_COOLDOWN_SECONDS,
    )


def verify_code(*, challenge_id, code):
    """Consume a valid code and return its purpose-specific next step."""
    now = timezone.now()
    invalid_code = False
    with transaction.atomic():
        try:
            challenge = PhoneVerificationChallenge.objects.select_for_update().get(
                pk=challenge_id
            )
        except (PhoneVerificationChallenge.DoesNotExist, ValueError) as error:
            raise InvalidPhoneVerificationCode() from error

        if challenge.locked_until and challenge.locked_until > now:
            raise PhoneVerificationRateLimited(
                _retry_after(challenge.locked_until),
                "phone_verification_temporarily_blocked",
            )
        if not challenge.expires_at or challenge.expires_at <= now:
            raise InvalidPhoneVerificationCode()
        if not constant_time_compare(
            challenge.code_digest, _code_digest(challenge.pk, code)
        ):
            challenge.failed_attempts += 1
            if challenge.failed_attempts >= settings.OTP_FAILED_ATTEMPT_LIMIT:
                challenge.locked_until = now + timedelta(
                    seconds=settings.OTP_LOCKOUT_SECONDS
                )
                challenge.code_digest = ""
                challenge.expires_at = now
            challenge.save(
                update_fields=(
                    "failed_attempts",
                    "locked_until",
                    "code_digest",
                    "expires_at",
                    "updated_at",
                )
            )
            invalid_code = True
        else:
            existing_account = (
                challenge.purpose == PhoneVerificationChallenge.Purpose.SIGNUP
                and User.objects.filter(phone_number=challenge.phone_number).exists()
            )
            if not existing_account:
                token = secrets.token_urlsafe(32)
                PhoneVerificationTicket.objects.create(
                    token_digest=_ticket_digest(token),
                    challenge=challenge,
                    purpose=challenge.purpose,
                    user=challenge.user,
                    expires_at=now + timedelta(seconds=settings.OTP_TICKET_TTL_SECONDS),
                )
            challenge.code_digest = ""
            challenge.expires_at = now
            challenge.save(update_fields=("code_digest", "expires_at", "updated_at"))

    if invalid_code:
        raise InvalidPhoneVerificationCode()

    if existing_account:
        return VerificationResult(existing_account=True)
    return VerificationResult(
        token=token,
        expires_in_seconds=settings.OTP_TICKET_TTL_SECONDS,
    )


def ticket_for_use(*, token, purpose):
    """Lock a current ticket for an atomic signup or password-reset completion."""
    now = timezone.now()
    try:
        ticket = (
            PhoneVerificationTicket.objects.select_for_update(of=("self",))
            .select_related("challenge", "user")
            .get(token_digest=_ticket_digest(token), purpose=purpose)
        )
    except PhoneVerificationTicket.DoesNotExist as error:
        raise InvalidPhoneVerificationTicket() from error
    if ticket.consumed_at or ticket.expires_at <= now:
        raise InvalidPhoneVerificationTicket()
    return ticket


def consume_ticket(ticket):
    ticket.consumed_at = timezone.now()
    ticket.save(update_fields=("consumed_at",))
