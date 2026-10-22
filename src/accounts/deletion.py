"""Deleting an account while keeping what it uploaded.

Uploads and centre checks stay published. They lose the link to the person
and are marked with a ``deletion_id`` instead, so staff can tell that rows
came from the same deleted account without knowing whose it was.
"""

import logging
import uuid

from django.contrib.sessions.models import Session
from django.db import transaction
from django.db.models import Q
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils import timezone

from accounts.models import PhoneVerificationChallenge, User
from accounts.phone_verification import PASSWORD_RESET_PHONE_NUMBER_SESSION_KEY
from results.models import (
    Aspirant,
    Party,
    PollingStationPresidentialExtras,
    PollingStationPresidentialResults,
)
from specs.models import is_author
from stations.models import PollingCenter, PollingCenterVerification, PollingStation

logger = logging.getLogger("accounts.deletion")

# Every model that keeps its rows when the account linked to them is deleted:
# (name in the log line, model, field linking to the account).
KEPT_CONTRIBUTIONS = (
    ("presidential_results", PollingStationPresidentialResults, "added_by"),
    ("presidential_extras", PollingStationPresidentialExtras, "added_by"),
    ("parties", Party, "verified_by"),
    ("aspirants", Aspirant, "verified_by"),
    ("polling_centers", PollingCenter, "verified_by"),
    ("polling_stations", PollingStation, "verified_by"),
    ("polling_center_verifications", PollingCenterVerification, "verified_by"),
)


class DeletionRefused(Exception):
    """Staff, administrator, and author accounts are deleted by an administrator."""


def can_delete_self(user):
    return not (user.is_staff or user.is_admin or is_author(user))


def delete_account(user, channel):
    """Delete the account and its personal data; keep its contributions.

    ``channel`` is ``"app"`` or ``"web"``, for the log line only.
    """
    if not can_delete_self(user):
        raise DeletionRefused

    deletion_id = uuid.uuid4()
    contributions = {}
    with transaction.atomic():
        # Before the account row goes: SET_NULL would empty the links first,
        # and the rows could no longer be told apart from anonymous ones.
        for name, model, link in KEPT_CONTRIBUTIONS:
            count = model.objects.filter(**{link: user}).update(
                **{link: None, "account_deleted": True, "deletion_id": deletion_id}
            )
            if count:
                contributions[name] = count

        PhoneVerificationChallenge.objects.filter(
            Q(user=user) | Q(phone_number=user.phone_number)
        ).delete()
        _delete_sessions(user)

        # Knox tokens and any OTP devices go with the row (CASCADE).
        user._deleting_via_delete_account = True
        user.delete()

        transaction.on_commit(
            lambda: logger.info(
                "account_deleted",
                extra={
                    "event": "account_deleted",
                    "deletion_id": str(deletion_id),
                    "channel": channel,
                    "contributions": contributions,
                    # Passed so the request filter does not add the real ones:
                    # either would link the deleted person to their uploads.
                    "request_id": "-",
                    "user_id": "-",
                },
            )
        )


def _delete_sessions(user):
    """Web sessions signed in as the account, or holding its phone number.

    The session table has no user column, so each live session is decoded.
    """
    user_id = str(user.pk)
    phone_number = str(user.phone_number)
    stale = []
    for session in Session.objects.filter(expire_date__gt=timezone.now()).iterator():
        data = session.get_decoded()
        if (
            data.get("_auth_user_id") == user_id
            or data.get(PASSWORD_RESET_PHONE_NUMBER_SESSION_KEY) == phone_number
        ):
            stale.append(session.pk)
    Session.objects.filter(pk__in=stale).delete()


@receiver(pre_delete, sender=User)
def refuse_other_deletions(sender, instance, **kwargs):
    # Any other path, such as the admin or a cascade, would skip marking the
    # account's contributions and writing the deletion log.
    if not getattr(instance, "_deleting_via_delete_account", False):
        raise DeletionRefused(
            "Accounts are deleted only by accounts.deletion.delete_account."
        )
