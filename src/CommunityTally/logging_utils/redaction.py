"""Scrubbing of credentials and personal data from log records.

The filter here is the last line of defence, not the first: call sites should
not pass secrets to the logger at all. It exists because they eventually will.
Someone logs a whole request body while debugging, and that body holds a
password or a phone number.

Phone numbers matter as much as credentials in this project. The people they
belong to are mostly ordinary users, citizens submitting what was announced at
their polling station, and the number is what ties a submission back to a
person. The logs sit on a server that could be seized.
"""

import logging
import re

REDACTED = "[redacted]"

# Matched against mapping keys, case-insensitively, as substrings: "password"
# also covers "new_password1" and "confirm_password".
SENSITIVE_KEY_PARTS = (
    "password",
    "passwd",
    "secret",
    "token",
    "authorization",
    "auth",
    "api_key",
    "apikey",
    "credential",
    "session",
    "cookie",
)

# Kenyan mobile numbers, in the shapes this codebase actually stores and
# receives: +254 7XX XXX XXX, 254…, and the local 07XX / 01XX forms.
PHONE_RE = re.compile(r"(?:\+?254|\b0)[17]\d{8}\b")

# Long opaque strings following a token-ish label, for the free-text case where
# there is no mapping key to match on. The optional scheme keeps
# "Authorization: Bearer <token>" from redacting the word "Bearer" and leaving
# the token itself in the clear.
TOKEN_RE = re.compile(
    r"((?:token|password|secret|authorization|bearer)"
    # A few words of prose between the label and the value, so "Token from
    # server: abc123" is caught as well as "token=abc123".
    r"[\w ]{0,24}?[:=]\s*" r"(?:(?:bearer|token)\s+)?)"
    # Values are opaque, so a length floor keeps ordinary prose out.
    r"([^\s,;'\"]{6,})",
    re.IGNORECASE,
)


def _is_sensitive_key(key: object) -> bool:
    if not isinstance(key, str):
        return False
    lowered = key.lower()
    return any(part in lowered for part in SENSITIVE_KEY_PARTS)


def scrub_text(text: str) -> str:
    """Redact secrets that appear inside an already-formatted string.

    Secrets are caught by shape, since a formatted string has no keys left to
    match on::

        "login attempt from +254712345678 failed"
            -> "login attempt from [redacted] failed"
        "Token from server: 9f8a7b6c5d4e3f2a"
            -> "Token from server: [redacted]"
        "Authorization: Bearer 9f8a7b6c5d4e"
            -> "Authorization: Bearer [redacted]"

    Ordinary lines are left alone, because a log nobody can read gets switched
    off, and then there is no log at all::

        "ward 094 has 1234 stations"        -> unchanged
        "password validation failed"        -> unchanged

    This path is best-effort: a secret with no label near it is
    indistinguishable from any other string. Structured values go through
    :func:`scrub` instead, which matches on keys and is reliable.
    """
    text = PHONE_RE.sub(REDACTED, text)
    return TOKEN_RE.sub(lambda m: f"{m.group(1)}{REDACTED}", text)


def scrub(value: object, _depth: int = 0) -> object:
    """Return ``value`` with sensitive fields replaced by ``[redacted]``.

    Matching is on keys, which makes this the reliable path::

        {"phone_number": "+254712345678", "password": "x", "ward_code": "094"}
            -> {"phone_number": "[redacted]", "password": "[redacted]",
                "ward_code": "094"}

    The key survives so the log still shows that a password was submitted,
    which is usually the thing being debugged.

    Recurses through mappings and sequences so that request bodies, serializer
    data and DRF error dicts are all covered. Depth is bounded because log
    arguments are not trusted to be acyclic or shallow.
    """
    if _depth > 6:
        return value

    if isinstance(value, str):
        return scrub_text(value)

    if isinstance(value, dict):
        return {
            key: (REDACTED if _is_sensitive_key(key) else scrub(item, _depth + 1))
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple, set)):
        scrubbed = [scrub(item, _depth + 1) for item in value]
        return (
            type(value)(scrubbed) if not isinstance(value, tuple) else tuple(scrubbed)
        )

    # QueryDict and other mappings that are not dict subclasses.
    if hasattr(value, "items") and callable(value.items):
        try:
            return {
                key: (REDACTED if _is_sensitive_key(key) else scrub(item, _depth + 1))
                for key, item in value.items()
            }
        except Exception:  # pragma: no cover - defensive, never break logging
            return value

    return value


class RedactionFilter(logging.Filter):
    """Scrubs every record before a handler can emit it.

    Attached to handlers rather than loggers so that it cannot be bypassed by
    logging through a child logger.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = scrub_text(record.msg)
        else:
            record.msg = scrub(record.msg)

        if record.args:
            record.args = scrub(record.args)

        return True
