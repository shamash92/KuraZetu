"""Shared password-attempt identity, privacy boundary, and lockout responses."""

import logging
import math
from ipaddress import ip_address, ip_network

from django.conf import settings
from django.http import HttpResponse, JsonResponse, QueryDict
from django.shortcuts import render
from django.utils import timezone
from django.utils.crypto import salted_hmac

from axes.handlers.database import AxesDatabaseHandler
from axes.helpers import get_cool_off
from axes.models import AccessAttempt
from phonenumber_field.phonenumber import PhoneNumber

logger = logging.getLogger("accounts.security")
LOCKOUT_MESSAGE = "Too many failed login attempts. Please try again later."


def account_reference(request, credentials=None):
    """Correlate equivalent numbers without copying phone numbers into Axes."""
    credentials = credentials or {}
    value = credentials.get("phone_number") or credentials.get("username")
    if value is None and request is not None:
        value = request.POST.get("phone_number") or request.POST.get("username")
    value = str(value or "")[:254]
    number = PhoneNumber.from_string(value)
    if number.is_valid():
        value = number.as_e164
    return salted_hmac("accounts.login", value, algorithm="sha256").hexdigest()


def client_ip(request):
    """Trust a forwarded single IP only from explicitly configured proxy peers."""
    try:
        peer = ip_address(request.META.get("REMOTE_ADDR", ""))
    except ValueError:
        return None
    header = settings.AUTH_CLIENT_IP_HEADER
    trusted = any(
        peer in ip_network(network) for network in settings.AUTH_TRUSTED_PROXY_NETWORKS
    )
    if header and trusted:
        try:
            return str(ip_address(request.META.get(header, "")))
        except ValueError:
            # Do not guess which entry in an unverified forwarded chain is real.
            return str(peer)
    return str(peer)


def log_event(request, event, *, credentials=None, user=None):
    """Emit only deliberate fields; callers never supply raw request payloads."""
    if request is None:
        return
    route = getattr(request, "resolver_match", None)
    extra = {
        "event": event,
        "client_ip": client_ip(request),
        "endpoint": route.view_name if route else "-",
        "user_id": user.pk if user is not None else "-",
    }
    if credentials is not None:
        extra["account_ref"] = account_reference(request, credentials)
    elif user is not None:
        extra["account_ref"] = account_reference(
            request, {"phone_number": user.get_username()}
        )
    logger.info(event, extra=extra)


class PrivateAxesHandler(AxesDatabaseHandler):
    """Retain counters, not submitted forms or arbitrary client headers.

    Axes 8.3.1 reads GET/POST directly when persisting failures. Restore those
    objects even on errors, so the form/view and other receivers see the request.
    A constant user agent also prevents header rotation creating extra DB rows.
    """

    def user_login_failed(self, sender, credentials, request=None, **kwargs):
        if request is None:
            return
        original_get, original_post = request.GET, request.POST
        request.axes_user_agent = ""
        request.axes_http_accept = ""
        request.axes_path_info = ""
        try:
            request.GET = QueryDict()
            request.POST = QueryDict()
            return super().user_login_failed(sender, credentials, request, **kwargs)
        finally:
            request.GET, request.POST = original_get, original_post


def lockout_response(request, original_response=None, credentials=None):
    """Return HTML for forms and a stable JSON contract for account API calls."""
    latest = (
        AccessAttempt.objects.filter(
            username=account_reference(request, credentials),
            ip_address=client_ip(request),
        )
        .order_by("-attempt_time")
        .values_list("attempt_time", flat=True)
        .first()
    )
    cooloff = get_cool_off(request)
    remaining = (latest + cooloff - timezone.now()) if latest else cooloff
    seconds = max(1, math.ceil(remaining.total_seconds()))
    if request.path_info.startswith("/api/"):
        response = JsonResponse(
            {
                "code": "login_temporarily_blocked",
                "error": LOCKOUT_MESSAGE,
                "retry_after_seconds": seconds,
            },
            status=429,
        )
    elif request.path_info == "/accounts/login/":
        from accounts.forms import LoginForm

        form = LoginForm(request=request)
        # An unbound form displays the lockout without re-running authentication.
        response = render(
            request,
            "accounts/login.html",
            {"form": form, "lockout_message": LOCKOUT_MESSAGE},
            status=429,
        )
    else:
        # Preserve the admin and DRF login routes instead of rendering the
        # public account form at a different endpoint.
        response = HttpResponse(LOCKOUT_MESSAGE, status=429)
    response["Retry-After"] = str(seconds)
    response["Cache-Control"] = "no-store"
    return response
