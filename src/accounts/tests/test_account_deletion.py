import json
import logging

from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.db import transaction
from django.urls import reverse

import pytest
from axes.models import AccessAttempt
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.authentication import issue_native_token
from accounts.deletion import DeletionRefused
from accounts.models import PhoneVerificationChallenge
from CommunityTally.logging_utils.formatters import JSONFormatter
from CommunityTally.logging_utils.request_id import RequestContextFilter
from results.models import (
    Aspirant,
    Party,
    PollingStationPresidentialExtras,
    PollingStationPresidentialResults,
)
from specs.models import AuthorGrant
from stations.models import (
    Constituency,
    County,
    PollingCenter,
    PollingCenterVerification,
    PollingStation,
    Ward,
)

User = get_user_model()
NUMBER = "+254700000001"
PASSWORD = "test-password-only"

pytestmark = pytest.mark.django_db


@pytest.fixture
def user():
    user = User.objects.create_user(phone_number=NUMBER, password=PASSWORD)
    user.first_name = "Njoki"
    user.last_name = "Mwangi"
    user.is_phone_verified = True
    user.save()
    return user


@pytest.fixture
def deletion_log():
    """The lines the deletion logger writes, formatted as in production."""
    lines = []

    class Collect(logging.Handler):
        def emit(self, record):
            lines.append(self.format(record))

    handler = Collect()
    handler.setFormatter(JSONFormatter())
    handler.addFilter(RequestContextFilter())
    logger = logging.getLogger("accounts.deletion")
    logger.addHandler(handler)
    yield lines
    logger.removeHandler(handler)


def contributions_by(user):
    """One row of every model that keeps its rows after the account is gone."""
    ward = Ward.objects.create(
        name="Ward",
        number=1,
        constituency=Constituency.objects.create(
            name="Constituency",
            number=1,
            county=County.objects.create(name="County", number=1),
        ),
    )
    center = PollingCenter.objects.create(
        name="Centre", code="001", ward=ward, verified_by=user
    )
    station = PollingStation.objects.create(
        polling_center=center,
        code="000000101",
        registered_voters=500,
        verified_by=user,
    )
    party = Party.objects.create(name="Party", short_name="P", verified_by=user)
    aspirant = Aspirant.objects.create(
        first_name="A", last_name="B", party=party, level="president", verified_by=user
    )
    return [
        center,
        station,
        party,
        aspirant,
        PollingCenterVerification.objects.create(
            polling_center=center, verified_by=user
        ),
        PollingStationPresidentialResults.objects.create(
            polling_station=station,
            presidential_candidate=aspirant,
            votes=10,
            added_by=user,
        ),
        PollingStationPresidentialExtras.objects.create(
            polling_station=station, added_by=user
        ),
    ]


def delete_request(token, password=PASSWORD):
    return APIClient().post(
        reverse("native_delete_account_api"),
        {"password": password},
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )


def test_deleting_an_account_keeps_its_uploads_without_the_person(
    user, deletion_log, client, django_capture_on_commit_callbacks
):
    _, token = issue_native_token(user)
    client.force_login(user)
    PhoneVerificationChallenge.objects.create(
        phone_number=NUMBER, purpose="password_reset"
    )
    kept = contributions_by(user)
    anonymous = PollingCenterVerification.objects.create(
        polling_center=kept[0], verified_by=None
    )
    user_pk = user.pk

    with django_capture_on_commit_callbacks(execute=True):
        response = delete_request(token)

    assert response.status_code == 204
    assert not User.objects.filter(pk=user_pk).exists()
    assert not AuthToken.objects.exists()
    assert not Session.objects.exists()
    assert not PhoneVerificationChallenge.objects.exists()

    rows = [type(row).objects.get(pk=row.pk) for row in kept]
    deletion_ids = {row.deletion_id for row in rows}
    assert len(deletion_ids) == 1 and None not in deletion_ids
    for row in rows:
        link = "added_by" if hasattr(row, "added_by") else "verified_by"
        assert getattr(row, f"{link}_id") is None
        assert row.account_deleted
    anonymous.refresh_from_db()
    assert not anonymous.account_deleted and anonymous.deletion_id is None

    [line] = deletion_log
    logged = json.loads(line)
    assert logged["deletion_id"] == str(deletion_ids.pop())
    assert logged["channel"] == "app"
    assert logged["request_id"] == "-" and logged["user_id"] == "-"
    assert "account_ref" not in logged
    for identifying in (NUMBER[4:], "Njoki", "Mwangi"):
        assert identifying not in line


def test_a_wrong_password_deletes_nothing_and_counts_towards_the_lock(user):
    _, token = issue_native_token(user)

    response = delete_request(token, password="wrong-password")

    assert response.status_code == 400
    assert User.objects.filter(pk=user.pk).exists()
    assert AccessAttempt.objects.get().failures_since_start == 1


@pytest.mark.parametrize("kind", ["staff", "author"])
def test_staff_and_author_accounts_are_told_to_ask_an_administrator(user, kind):
    if kind == "staff":
        user.staff = True
        user.save()
    else:
        AuthorGrant.objects.create(user=user)
    _, token = issue_native_token(user)

    response = delete_request(token)

    assert response.status_code == 403
    assert response.json()["code"] == "deletion_refused"
    assert User.objects.filter(pk=user.pk).exists()


def test_accounts_cannot_be_deleted_any_other_way(user):
    with pytest.raises(DeletionRefused), transaction.atomic():
        User.objects.filter(pk=user.pk).delete()
    assert User.objects.filter(pk=user.pk).exists()
