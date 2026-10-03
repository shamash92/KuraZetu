from django.contrib.auth import get_user_model
from django.urls import reverse

import pytest
from rest_framework.test import APIClient

from specs.models import AccessPolicy, Revision, Specification

pytestmark = pytest.mark.django_db

BODY = "# Synthetic\n\nPlaceholder text for tests."


def published(slug, policy, **fields):
    spec = Specification.objects.create(slug=slug, access_policy=policy, **fields)
    spec.current_revision = Revision.objects.create(
        specification=spec,
        sequence=1,
        title=f"Real title of {slug}",
        summary=f"Real summary of {slug}",
        body=BODY,
    )
    spec.save()
    return spec


def library():
    public = published("public", AccessPolicy.PUBLIC)
    listed = published(
        "listed",
        AccessPolicy.RESTRICTED_LISTED,
        safe_listing_title="Safe title",
        safe_listing_summary="Safe summary",
    )
    concealed = published("concealed", AccessPolicy.RESTRICTED_CONCEALED)
    Specification.objects.create(slug="unpublished", access_policy=AccessPolicy.PUBLIC)
    return public, listed, concealed


def signed_in(number="+254700000001", **flags):
    user = get_user_model().objects.create_user(
        phone_number=number, password="test-password-only"
    )
    for flag, value in flags.items():
        setattr(user, flag, value)
    user.save()
    client = APIClient()
    client.force_authenticate(user)
    return client, user


def page(client, slug):
    return client.get(reverse("specs_page_api", args=[slug]))


def test_visitor_reads_public_and_sees_only_safe_metadata_for_listed():
    library()
    visitor = APIClient()

    entries = visitor.get(reverse("specs_library_api")).json()
    assert entries == [
        {
            "slug": "listed",
            "title": "Safe title",
            "summary": "Safe summary",
            "access": "locked",
            "archived": False,
        },
        {
            "slug": "public",
            "title": "Real title of public",
            "summary": "Real summary of public",
            "access": "full",
            "archived": False,
        },
    ]

    assert page(visitor, "public").json()["body"] == BODY
    assert page(visitor, "listed").json() == entries[0]


def test_concealed_and_unpublished_look_exactly_like_missing():
    library()
    visitor = APIClient()

    missing = page(visitor, "no-such-specification")
    assert missing.status_code == 404
    for slug in ("concealed", "unpublished"):
        response = page(visitor, slug)
        assert response.status_code == 404
        assert response.json() == missing.json()


def test_only_the_reader_list_opens_a_restricted_specification():
    _, listed, concealed = library()
    reader, account = signed_in()
    listed.readers.add(account)
    concealed.readers.add(account)

    slugs = [entry["slug"] for entry in reader.get(reverse("specs_library_api")).json()]
    assert slugs == ["concealed", "listed", "public"]
    assert page(reader, "listed").json()["title"] == "Real title of listed"
    assert page(reader, "concealed").json()["body"] == BODY

    privileged, _ = signed_in(
        "+254700000002",
        staff=True,
        admin=True,
        is_verified=True,
        is_phone_verified=True,
        role="election_officer",
    )
    assert page(privileged, "concealed").status_code == 404
    assert "body" not in page(privileged, "listed").json()

    concealed.readers.remove(account)
    assert page(reader, "concealed").status_code == 404


def test_superseding_specification_is_linked_only_when_discoverable():
    public, listed, concealed = library()
    public.superseded_by = concealed
    public.save()
    visitor = APIClient()
    assert page(visitor, "public").json()["superseded_by"] is None

    public.superseded_by = listed
    public.save()
    assert page(visitor, "public").json()["superseded_by"]["title"] == "Safe title"


def test_responses_are_never_stored_in_a_shared_cache():
    library()
    response = page(APIClient(), "public")
    assert "no-store" in response["Cache-Control"]
    assert "private" in response["Cache-Control"]
