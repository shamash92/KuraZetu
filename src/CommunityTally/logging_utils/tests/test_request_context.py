"""Tests for request and user correlation on log records.

The user is identified by primary key, never by phone number: the key is
meaningless without the database, and whoever holds the database already has
the numbers.
"""

import logging

from django.contrib.auth import get_user_model
from django.test import RequestFactory

import pytest

from CommunityTally.logging_utils.request_id import (
    ANONYMOUS,
    HEADER,
    RequestContextFilter,
    RequestIDMiddleware,
    get_request_id,
    get_user_id,
)

User = get_user_model()


def _record():
    return logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="anything",
        args=None,
        exc_info=None,
    )


class TestOutsideARequest:
    """Management commands, shells and Celery tasks log too."""

    def test_request_id_falls_back(self):
        assert get_request_id() == "-"

    def test_user_id_falls_back(self):
        assert get_user_id() == ANONYMOUS

    def test_filter_still_populates_the_record(self):
        record = _record()

        RequestContextFilter().filter(record)

        assert record.request_id == "-"
        assert record.user_id == ANONYMOUS


class TestRequestID:
    def test_mints_an_id_when_none_is_supplied(self):
        seen = {}

        def view(request):
            seen["id"] = get_request_id()
            return _Response()

        response = RequestIDMiddleware(view)(RequestFactory().get("/"))

        assert seen["id"] != "-"
        assert response[HEADER] == seen["id"]

    def test_adopts_an_inbound_id(self):
        def view(request):
            return _Response()

        request = RequestFactory().get("/", headers={"x-request-id": "abc123"})
        response = RequestIDMiddleware(view)(request)

        assert response[HEADER] == "abc123"

    def test_truncates_an_oversized_inbound_id(self):
        # A caller must not be able to pad every log line with 4KB of junk.
        request = RequestFactory().get("/", headers={"x-request-id": "x" * 500})
        response = RequestIDMiddleware(lambda r: _Response())(request)

        assert len(response[HEADER]) == 64

    def test_context_is_cleared_after_the_response(self):
        RequestIDMiddleware(lambda r: _Response())(RequestFactory().get("/"))

        assert get_request_id() == "-"


@pytest.mark.django_db
class TestUserID:
    def test_anonymous_requests_report_a_dash(self):
        seen = {}

        def view(request):
            seen["user"] = get_user_id()
            return _Response()

        RequestIDMiddleware(view)(RequestFactory().get("/"))

        assert seen["user"] == ANONYMOUS

    def test_authenticated_requests_report_the_primary_key(self):
        user = User.objects.create_user(
            phone_number="+254712345678", password="irrelevant"
        )
        seen = {}

        def view(request):
            seen["user"] = get_user_id()
            return _Response()

        request = RequestFactory().get("/")
        request.user = user
        RequestIDMiddleware(view)(request)

        assert seen["user"] == user.pk

    def test_resolves_a_user_authenticated_during_the_view(self):
        # DRF authenticates inside the view, not in middleware, so a token
        # caller looks anonymous while middleware runs. Resolution has to be
        # lazy or every API line would say "-".
        user = User.objects.create_user(
            phone_number="+254712345679", password="irrelevant"
        )
        seen = {}

        def view(request):
            request.user = user  # what DRF does on first access
            seen["user"] = get_user_id()
            return _Response()

        RequestIDMiddleware(view)(RequestFactory().get("/"))

        assert seen["user"] == user.pk

    def test_does_not_leak_between_requests(self):
        user = User.objects.create_user(
            phone_number="+254712345670", password="irrelevant"
        )

        first = RequestFactory().get("/")
        first.user = user
        RequestIDMiddleware(lambda r: _Response())(first)

        assert get_user_id() == ANONYMOUS


class TestExplicitOverrides:
    """Background tasks act for a user that is not making the request."""

    def test_extra_wins_over_the_ambient_value(self):
        record = _record()
        record.user_id = 999

        RequestContextFilter().filter(record)

        assert record.user_id == 999


class _Response(dict):
    """Minimal stand-in: the middleware only sets a header on it."""

    def __setitem__(self, key, value):
        super().__setitem__(key, value)
