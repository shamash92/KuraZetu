"""Correlation of log lines belonging to a single request, and to one user.

Without this, a production log is a flat stream: five lines from five
concurrent requests interleave and nothing says which belongs to which. With
it, one request's story is a filter away::

    journalctl -u kurazetu -o json | jq 'select(.request_id=="a1b2c3d4")'
    journalctl -u kurazetu -o json | jq 'select(.user_id==4821)'

The user is identified by primary key, never by phone number. The key is a
handle that means nothing without the database, and anyone holding the database
already has the phone numbers — so the log adds no exposure that did not exist.
Putting the number itself here would copy a secret into a second store with
weaker protections and longer retention.
"""

import logging
import uuid
from contextvars import ContextVar

# Context variables rather than thread-local storage, so values survive async
# views and cannot leak between concurrent requests on one worker.
_request: ContextVar[object] = ContextVar("log_request", default=None)
_request_id: ContextVar[str] = ContextVar("request_id", default="-")

# Distinguishes "not looked up yet" from "looked up, nobody was signed in".
_UNSET = object()
_user_id: ContextVar[object] = ContextVar("user_id", default=_UNSET)

ANONYMOUS = "-"
HEADER = "X-Request-ID"


def get_request_id() -> str:
    return _request_id.get()


def get_user_id():
    """The signed-in user's primary key, or ``-``.

    Resolved at log time rather than when the request arrives, because DRF
    authenticates during view dispatch: a token-authenticated caller still
    looks anonymous while middleware is running. The result is cached for the
    rest of the request so that a chatty view cannot turn one lookup into
    dozens.
    """
    cached = _user_id.get()
    if cached is not _UNSET:
        return cached

    value = ANONYMOUS
    request = _request.get()
    if request is not None:
        try:
            user = getattr(request, "user", None)
            if user is not None and getattr(user, "is_authenticated", False):
                value = user.pk
        except Exception:  # pragma: no cover - logging must never raise
            value = ANONYMOUS

    _user_id.set(value)
    return value


class RequestContextFilter(logging.Filter):
    """Puts ``request_id`` and ``user_id`` on every record.

    Values already supplied through ``extra=`` win, so a call site can name a
    different user than the one making the request — which is what background
    tasks and admin actions need.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = get_request_id()
        if not hasattr(record, "user_id"):
            record.user_id = get_user_id()
        return True


class RequestIDMiddleware:
    """Adopts an inbound request ID or mints one, and echoes it back.

    An inbound header is trusted only as a correlation key. It is never used
    for authorisation, and it is bounded in length so a caller cannot pad the
    logs with an arbitrarily large value.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        inbound = request.headers.get(HEADER, "")
        request_id = inbound[:64] if inbound else uuid.uuid4().hex[:16]

        id_token = _request_id.set(request_id)
        request_token = _request.set(request)
        user_token = _user_id.set(_UNSET)
        request.request_id = request_id
        try:
            response = self.get_response(request)
        finally:
            _request_id.reset(id_token)
            _request.reset(request_token)
            _user_id.reset(user_token)

        response[HEADER] = request_id
        return response
