from django.contrib.auth import get_user_model
from django.urls import reverse

import pytest
from rest_framework.test import APIClient

from specs.models import AuthorGrant, Record

pytestmark = pytest.mark.django_db

READER_NUMBER = "+254700000009"


def account(number, **flags):
    user = get_user_model().objects.create_user(
        phone_number=number, password="test-password-only"
    )
    for flag, value in flags.items():
        setattr(user, flag, value)
    user.save()
    client = APIClient()
    client.force_authenticate(user)
    return client, user


def author():
    client, user = account("+254700000001")
    AuthorGrant.objects.create(user=user)
    return client


def url(name, *args):
    return reverse(name, args=args)


def create(client, title="Synthetic title"):
    return client.post(url("specs_author_library_api"), {"title": title}, format="json")


def created(client, title="Synthetic title"):
    return create(client, title).json()["slug"]


def save_draft(client, slug, **fields):
    return client.patch(
        url("specs_author_specification_api", slug), fields, format="json"
    )


def set_policy(client, slug, policy, **fields):
    return client.post(
        url("specs_access_policy_api", slug),
        {"access_policy": policy, **fields},
        format="json",
    )


def actions():
    return list(Record.objects.order_by("pk").values_list("action", "detail"))


def test_author_drafts_publishes_and_readers_keep_the_current_revision():
    writer = author()
    visitor = APIClient()

    new = writer.post(
        url("specs_author_library_api"),
        {"title": "Synthetic title", "slug": "synthetic-title"},
        format="json",
    ).json()
    assert new["access_policy"] == "RESTRICTED_CONCEALED"
    assert new["published"] is False
    # The address is made by the server and says nothing about the title.
    slug = new["slug"]
    assert slug.startswith("kz-") and "synthetic" not in slug

    publish = url("specs_publish_api", slug)
    assert writer.post(publish).status_code == 400

    save_draft(writer, slug, summary="First summary", body="First body")
    assert writer.post(publish).json()["has_unpublished_changes"] is False
    set_policy(writer, slug, "PUBLIC", confirm_widening=True)
    page = url("specs_page_api", slug)
    assert visitor.get(page).json()["body"] == "First body"

    edited = save_draft(writer, slug, title="Second title", body="Second body")
    assert edited.json()["has_unpublished_changes"] is True
    assert visitor.get(page).json()["body"] == "First body"

    writer.post(publish)
    assert visitor.get(page).json()["title"] == "Second title"

    detail = writer.get(url("specs_author_specification_api", slug)).json()
    assert [revision["sequence"] for revision in detail["revisions"]] == [2, 1]
    first = writer.get(url("specs_revision_api", slug, 1)).json()
    assert (first["title"], first["body"]) == ("Synthetic title", "First body")
    assert visitor.get(url("specs_revision_api", slug, 1)).status_code == 404


def test_widening_disclosure_needs_confirmation_and_narrowing_does_not():
    writer = author()
    visitor = APIClient()
    slug = created(writer)
    save_draft(writer, slug, body="Body")
    writer.post(url("specs_publish_api", slug))
    page = url("specs_page_api", slug)

    assert set_policy(writer, slug, "RESTRICTED_LISTED").status_code == 400
    save_draft(writer, slug, safe_listing_title="Safe title")
    assert set_policy(writer, slug, "RESTRICTED_LISTED").status_code == 409
    assert visitor.get(page).status_code == 404

    set_policy(writer, slug, "RESTRICTED_LISTED", confirm_widening=True)
    assert visitor.get(page).json()["title"] == "Safe title"
    assert save_draft(writer, slug, safe_listing_title=" ").status_code == 400

    assert set_policy(writer, slug, "PUBLIC").status_code == 409
    set_policy(writer, slug, "PUBLIC", confirm_widening=True)
    assert visitor.get(page).json()["body"] == "Body"

    assert set_policy(writer, slug, "RESTRICTED_CONCEALED").status_code == 200
    assert visitor.get(page).status_code == 404

    assert actions()[1:] == [
        ("PUBLISHED", "1"),
        ("POLICY_CHANGED", "RESTRICTED_CONCEALED>RESTRICTED_LISTED"),
        ("POLICY_CHANGED", "RESTRICTED_LISTED>PUBLIC"),
        ("POLICY_CHANGED", "PUBLIC>RESTRICTED_CONCEALED"),
    ]


def test_author_manages_the_reader_list_by_phone_number():
    writer = author()
    reader, _ = account(READER_NUMBER)
    slug = created(writer)
    save_draft(writer, slug, body="Body")
    writer.post(url("specs_publish_api", slug))
    readers = url("specs_readers_api", slug)
    page = url("specs_page_api", slug)

    unknown = writer.post(readers, {"phone_number": "+254700000404"}, format="json")
    assert unknown.status_code == 400
    assert reader.get(page).status_code == 404

    added = writer.post(readers, {"phone_number": READER_NUMBER}, format="json")
    assert added.json()["readers"] == [READER_NUMBER]
    assert reader.get(page).json()["body"] == "Body"

    removed = writer.delete(readers, {"phone_number": READER_NUMBER}, format="json")
    assert removed.json()["readers"] == []
    assert reader.get(page).status_code == 404

    assert [action for action, _ in actions()[2:]] == ["READER_ADDED", "READER_REMOVED"]


def test_only_an_author_grant_opens_the_author_routes():
    writer = author()
    slug = created(writer)
    privileged, user = account(
        "+254700000002", staff=True, admin=True, is_verified=True
    )
    routes = [
        url("specs_author_library_api"),
        url("specs_author_specification_api", slug),
        url("specs_revision_api", slug, 1),
    ]
    for client in (APIClient(), privileged):
        assert [client.get(route).status_code for route in routes] == [404] * 3
        assert create(client).status_code == 404
        assert client.post(url("specs_publish_api", slug)).status_code == 404

    grant = AuthorGrant.objects.create(user=user)
    unpublished = privileged.get(routes[1])
    assert unpublished.json()["title"] == "Synthetic title"

    grant.delete()
    assert privileged.get(routes[1]).status_code == 404
    assert [action for action, _ in actions()] == [
        "AUTHOR_GRANTED",
        "AUTHOR_GRANTED",
        "AUTHOR_REVOKED",
    ]


def test_author_archives_supersedes_and_deletes_only_unpublished():
    writer = author()
    slug = created(writer)
    successor = created(writer, "Synthetic successor")
    detail = url("specs_author_specification_api", slug)

    assert save_draft(writer, slug, superseded_by=slug).status_code == 400
    lifecycle = save_draft(writer, slug, archived=True, superseded_by=successor)
    assert (lifecycle.json()["archived"], lifecycle.json()["superseded_by"]) == (
        True,
        successor,
    )

    assert (
        writer.delete(url("specs_author_specification_api", successor)).status_code
        == 204
    )
    assert writer.get(detail).json()["superseded_by"] is None

    save_draft(writer, slug, body="Body")
    writer.post(url("specs_publish_api", slug))
    assert writer.delete(detail).status_code == 409
    library = writer.get(url("specs_author_library_api")).json()
    assert [entry["slug"] for entry in library] == [slug]
