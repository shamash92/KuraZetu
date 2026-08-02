"""Tests for the log redaction filter.

These are written as the things that must never appear in a log line, using
payloads shaped like the ones this codebase actually handles: signup and login
request bodies, DRF serializer data, and auth tokens.

The filter is a last line of defence — call sites should not log secrets in the
first place — so the cases below lean towards proving that it still catches
them when a call site is careless.
"""

import logging

from django.http import QueryDict

import pytest

from CommunityTally.logging_utils.redaction import (
    REDACTED,
    RedactionFilter,
    scrub,
    scrub_text,
)

# The same Kenyan number written every way the API accepts it.
KENYAN_NUMBERS = [
    "+254712345678",
    "254712345678",
    "0712345678",
    "0112345678",  # Safaricom's 011 range
]


class TestPhoneNumberScrubbing:
    """A phone number is the identifier that ties a contribution to a person,
    so it is treated as sensitive everywhere, not only under a known key."""

    @pytest.mark.parametrize("number", KENYAN_NUMBERS)
    def test_redacts_kenyan_numbers_in_free_text(self, number):
        assert number not in scrub_text(f"login attempt from {number} failed")

    @pytest.mark.parametrize("number", KENYAN_NUMBERS)
    def test_redacts_numbers_anywhere_in_the_line(self, number):
        assert scrub_text(number) == REDACTED

    def test_redacts_every_number_in_one_line(self):
        result = scrub_text("merging +254712345678 into 0798765432")

        assert "254712345678" not in result
        assert "0798765432" not in result

    def test_leaves_unrelated_numbers_alone(self):
        # Ward codes, counts and IDs are what logs are for.
        line = "ward 094 has 1234 stations, 15 verified"

        assert scrub_text(line) == line

    def test_leaves_other_countries_alone(self):
        # Only Kenyan numbers identify contributors here; a US test number in a
        # fixture should stay readable.
        assert "+14155552671" in scrub_text("called +14155552671")


class TestSensitiveKeys:
    """Anything whose key looks like a credential goes, whatever its value."""

    @pytest.mark.parametrize(
        "key",
        [
            "password",
            "password1",
            "confirm_password",
            "new_password",
            "PASSWORD",
            "passwd",
            "token",
            "auth_token",
            "expo_push_token",
            "Authorization",
            "api_key",
            "apiKey",
            "secret",
            "sessionid",
            "cookie",
        ],
    )
    def test_redacts_credential_keys(self, key):
        assert scrub({key: "hunter2"}) == {key: REDACTED}

    def test_keeps_everything_else(self):
        payload = {"ward_code": "094", "first_name": "Nyota", "age": 24}

        assert scrub(payload) == payload

    def test_redacts_the_value_without_dropping_the_key(self):
        # The key surviving is the point: you can still see that a password was
        # submitted, which is often the thing being debugged.
        assert "password" in scrub({"password": "hunter2"})


class TestRealisticPayloads:
    """The shapes that actually reach these log calls."""

    def test_signup_request_body(self):
        body = {
            "phone_number": "+254712345678",
            "password": "hunter2",
            "first_name": "Nyota",
            "ward_code": "094",
        }

        result = scrub(body)

        assert result["password"] == REDACTED
        assert result["phone_number"] == REDACTED
        assert result["first_name"] == "Nyota"
        assert result["ward_code"] == "094"

    def test_nested_serializer_errors(self):
        errors = {
            "user": {
                "phone_number": ["+254712345678 is already registered"],
                "password": ["Too short"],
            }
        }

        result = scrub(errors)

        assert result["user"]["password"] == REDACTED
        assert "254712345678" not in str(result)

    def test_list_of_records(self):
        rows = [
            {"phone_number": "+254712345678", "station": "094"},
            {"phone_number": "0798765432", "station": "095"},
        ]

        result = scrub(rows)

        assert [row["phone_number"] for row in result] == [REDACTED, REDACTED]
        assert [row["station"] for row in result] == ["094", "095"]

    def test_query_dict(self):
        # Django request.POST is a QueryDict, not a dict subclass, so it takes
        # the mapping fallback path.
        query = QueryDict("phone_number=%2B254712345678&password=hunter2")

        result = scrub(query)

        # QueryDict.items() yields the last value per key, so the fallback path
        # produces a plain dict of scalars rather than lists.
        assert result["password"] == REDACTED
        assert result["phone_number"] == REDACTED

    def test_token_in_free_text(self):
        assert "abc123def456" not in scrub_text("token=abc123def456 issued")

    def test_bearer_header(self):
        assert "9f8a7b6c5d4e" not in scrub_text("Authorization: Bearer 9f8a7b6c5d4e")

    def test_token_with_prose_before_the_value(self):
        # The exact shape at accounts/api/views.py:76.
        assert "9f8a7b6c5d4e" not in scrub_text("Token from server: 9f8a7b6c5d4e")

    @pytest.mark.parametrize(
        "line",
        [
            "password validation failed, too short",
            "token refresh scheduled",
            "secret ballot counted in ward 094",
        ],
    )
    def test_does_not_redact_ordinary_prose(self, line):
        # Over-redaction is its own failure: a log nobody can read gets turned
        # off, and then there is no log at all.
        assert scrub_text(line) == line


class TestStructurePreservation:
    """Redaction must not change the shape of what was logged, or the log
    becomes harder to read than the thing it replaced."""

    def test_preserves_tuples(self):
        result = scrub(("094", {"password": "x"}))

        assert isinstance(result, tuple)
        assert result[0] == "094"

    def test_preserves_non_string_keys(self):
        assert scrub({1: "one", None: "none"}) == {1: "one", None: "none"}

    def test_passes_through_unknown_types(self):
        sentinel = object()

        assert scrub(sentinel) is sentinel

    def test_stops_recursing_on_deep_structures(self):
        # A cyclic or very deep object must not turn one log line into a hang.
        deep: dict = {}
        node = deep
        for _ in range(50):
            node["next"] = {}
            node = node["next"]
        node["password"] = "hunter2"

        scrub(deep)  # must return rather than recurse to the bottom


class TestRedactionFilter:
    """The filter is attached to the handler, so these cover what a handler
    would see rather than what a call site passed."""

    def _record(self, msg, args=None):
        return logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg=msg,
            args=args,
            exc_info=None,
        )

    def test_scrubs_the_message(self):
        record = self._record("login for +254712345678")

        RedactionFilter().filter(record)

        assert "254712345678" not in record.getMessage()

    def test_scrubs_dict_arguments(self):
        record = self._record("payload %s", ({"password": "hunter2"},))

        RedactionFilter().filter(record)

        assert "hunter2" not in record.getMessage()

    def test_scrubs_percent_style_mapping_args(self):
        # logger.info("%(k)s", {...}) reaches LogRecord as a one-tuple, which
        # the constructor unwraps; passing the bare dict is not the real path.
        record = self._record(
            "phone %(phone_number)s", ({"phone_number": "0712345678"},)
        )

        RedactionFilter().filter(record)

        assert "0712345678" not in record.getMessage()

    def test_leaves_clean_records_untouched(self):
        record = self._record("imported %s stations", (1234,))

        RedactionFilter().filter(record)

        assert record.getMessage() == "imported 1234 stations"

    def test_always_lets_the_record_through(self):
        # Returning False would silently drop the line instead of cleaning it.
        assert RedactionFilter().filter(self._record("anything")) is True


class TestEndToEnd:
    """Through a real handler, which is the only path that matters."""

    def test_secrets_do_not_reach_the_stream(self, caplog):
        logger = logging.getLogger("CommunityTally.tests.redaction")
        handler = logging.StreamHandler()
        handler.addFilter(RedactionFilter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

        with caplog.at_level(logging.INFO):
            logger.info(
                "signup %s",
                {"phone_number": "+254712345678", "password": "hunter2"},
            )

        logger.removeHandler(handler)

        emitted = caplog.records[0]
        RedactionFilter().filter(emitted)
        assert "hunter2" not in emitted.getMessage()
        assert "254712345678" not in emitted.getMessage()
