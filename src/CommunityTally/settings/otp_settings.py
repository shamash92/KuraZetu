"""Phone-verification settings shared by every deployment environment."""

from django.core.exceptions import ImproperlyConfigured

from decouple import config

OTP_SMS_BACKEND = config("OTP_SMS_BACKEND", default="fake")
OTP_AT_USERNAME = config("AT_USERNAME", default="")
OTP_AT_API_KEY = config("AT_API_KEY", default="")
OTP_ANDROID_SMS_RETRIEVER_HASH = config("OTP_ANDROID_SMS_RETRIEVER_HASH", default="")
OTP_CODE_LENGTH = 6

# A code is valid for two minutes from its most recent send.
OTP_CODE_TTL_SECONDS = config("OTP_CODE_TTL_SECONDS", default=120, cast=int)
# A verified signup/reset ticket can be used once within ten minutes.
OTP_TICKET_TTL_SECONDS = config("OTP_TICKET_TTL_SECONDS", default=600, cast=int)
# A new SMS is allowed only after the current two-minute code has expired.
OTP_RESEND_COOLDOWN_SECONDS = config(
    "OTP_RESEND_COOLDOWN_SECONDS", default=120, cast=int
)
# No more than three SMS requests for one phone and purpose per rolling window.
OTP_SEND_LIMIT = config("OTP_SEND_LIMIT", default=3, cast=int)
# The rolling per-phone send window is fifteen minutes.
OTP_SEND_WINDOW_SECONDS = config("OTP_SEND_WINDOW_SECONDS", default=900, cast=int)
# Across all phones and purposes, an IP can request at most ten SMS messages per window.
OTP_IP_SEND_LIMIT = config("OTP_IP_SEND_LIMIT", default=10, cast=int)
# Three incorrect codes invalidate the challenge and trigger a lockout.
OTP_FAILED_ATTEMPT_LIMIT = config("OTP_FAILED_ATTEMPT_LIMIT", default=3, cast=int)
# The phone/purpose lockout after too many wrong codes lasts fifteen minutes.
OTP_LOCKOUT_SECONDS = config("OTP_LOCKOUT_SECONDS", default=900, cast=int)

if OTP_SMS_BACKEND not in {"fake", "africastalking"}:
    raise ImproperlyConfigured("OTP_SMS_BACKEND must be 'fake' or 'africastalking'.")
if any(
    value < 1
    for value in (
        OTP_CODE_TTL_SECONDS,
        OTP_TICKET_TTL_SECONDS,
        OTP_RESEND_COOLDOWN_SECONDS,
        OTP_SEND_LIMIT,
        OTP_SEND_WINDOW_SECONDS,
        OTP_IP_SEND_LIMIT,
        OTP_FAILED_ATTEMPT_LIMIT,
        OTP_LOCKOUT_SECONDS,
    )
):
    raise ImproperlyConfigured("Phone verification limits must be positive.")
if OTP_ANDROID_SMS_RETRIEVER_HASH and len(OTP_ANDROID_SMS_RETRIEVER_HASH) != 11:
    raise ImproperlyConfigured("OTP_ANDROID_SMS_RETRIEVER_HASH must be 11 characters.")
