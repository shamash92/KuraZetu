"""Authentication audit events shared by web, API, and admin sign-ins."""

from django.contrib.auth.signals import (
    user_logged_in,
    user_logged_out,
    user_login_failed,
)
from django.dispatch import receiver

from accounts.auth_security import log_event


@receiver(user_login_failed)
def login_failed(sender, credentials, request=None, **kwargs):
    # Axes is installed before accounts, so its receiver has already classified
    # this attempt. Emit one outcome, including the attempt reaching the limit.
    event = (
        "auth.login_blocked"
        if getattr(request, "axes_locked_out", False)
        else "auth.login_failed"
    )
    log_event(request, event, credentials=credentials)


@receiver(user_logged_in)
def logged_in(sender, request, user, **kwargs):
    log_event(request, "auth.login_succeeded", user=user)


@receiver(user_logged_out)
def logged_out(sender, request, user, **kwargs):
    log_event(request, "auth.logout_succeeded", user=user)
