"""Sales onboarding, pending phone invitations, and owner-managed access."""

from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ValidationError
from django.urls import reverse

import pytest

from accounts.deletion import delete_account
from accounts.models import User
from results.dashboard_access import add_member
from results.dashboard_models import DashboardMember, MediaHouse, ResultsDashboard
from results.test_uploads import mca_candidates, ward  # noqa: F401

pytestmark = pytest.mark.django_db


def person(phone, **fields):
    user = User.objects.create_user(phone_number=phone, password="test-password")
    for name, value in fields.items():
        setattr(user, name, value)
    user.save()
    return user


def test_sales_staff_onboard_an_owner_who_can_invite_but_not_activate(client):
    sales = person("+254700000011", staff=True, is_phone_verified=True)
    client.force_login(sales)
    allowed = reverse("dashboard-access-permission")
    start = reverse("dashboard-access-create")
    assert client.get(allowed).status_code == 403
    permission = Permission.objects.get(codename="manage_dashboards")
    group, _ = Group.objects.get_or_create(name="Sales onboarding")
    group.permissions.add(permission)
    sales.groups.add(group)
    assert client.get(allowed).status_code == 200
    media = MediaHouse.objects.create(name="Example newsroom")
    response = client.post(
        start,
        {
            "kind": "media",
            "media_house": media.pk,
            "owner_phone": "0700000012",
            "active": True,
        },
        content_type="application/json",
    )
    assert response.status_code == 201
    dashboard = ResultsDashboard.objects.get()
    assert dashboard.members.get().user is None
    owner = person("+254700000012")
    assert dashboard.members.get().user is None
    owner.is_phone_verified = True
    owner.save()
    assert dashboard.members.get().user == owner
    client.force_login(owner)
    manage = reverse("dashboard-access-detail", args=[dashboard.pk])
    assert client.get(manage).status_code == 200
    assert (
        client.post(
            reverse("dashboard-access-members", args=[dashboard.pk]),
            {"phone_number": "0700000013"},
            content_type="application/json",
        ).status_code
        == 201
    )
    assert (
        client.patch(
            manage, {"name": "Changed"}, content_type="application/json"
        ).status_code
        == 403
    )
    viewer = person("+254700000013", is_phone_verified=True)
    client.force_login(viewer)
    assert client.get(manage).status_code == 403
    other = ResultsDashboard.objects.create(
        kind="media",
        name="Other newsroom",
        media_house=MediaHouse.objects.create(name="Other newsroom"),
        active=True,
    )
    with pytest.raises(ValidationError) as refused:
        add_member(other, viewer.phone_number)
    assert "already has a dashboard" in str(refused.value)
    client.force_login(owner)
    member = DashboardMember.objects.get(user=viewer)
    assert (
        client.delete(
            reverse("dashboard-access-member", args=[dashboard.pk, member.pk])
        ).status_code
        == 200
    )
    assert not DashboardMember.objects.filter(user=viewer).exists()
    dashboard.active = False
    dashboard.save()
    assert client.get(manage).status_code == 403


def test_staff_without_group_and_nonstaff_with_group_cannot_onboard(client):
    user = person("+254700000014")
    group = Group.objects.create(name="Test sales")
    group.permissions.add(Permission.objects.get(codename="manage_dashboards"))
    user.groups.add(group)
    client.force_login(user)
    assert client.get(reverse("dashboard-access-permission")).status_code == 403
    dashboard = ResultsDashboard.objects.create(
        kind="media",
        name="Example",
        media_house=MediaHouse.objects.create(name="Example"),
        active=True,
    )
    add_member(dashboard, user.phone_number)
    delete_account(user, "web")
    assert not DashboardMember.objects.exists()


@pytest.mark.parametrize("kind", ["aspirant", "party", "media"])
def test_one_dashboard_per_aspirant_party_or_media_house(client, mca_candidates, kind):
    sales = person("+254700000015", staff=True, admin=True, is_phone_verified=True)
    client.force_login(sales)
    candidate = mca_candidates[0]
    target = (
        candidate.pk
        if kind == "aspirant"
        else (
            candidate.party_id
            if kind == "party"
            else MediaHouse.objects.create(name="Example media").pk
        )
    )
    field = "media_house" if kind == "media" else kind
    payload = {"kind": kind, field: target, "owner_phone": "0700000016", "active": True}
    first = client.post(
        reverse("dashboard-access-create"), payload, content_type="application/json"
    )
    assert first.status_code == 201, first.json()
    assert "dashboard" in ResultsDashboard.objects.get().name
    second = client.post(
        reverse("dashboard-access-create"),
        {**payload, "owner_phone": "0700000017"},
        content_type="application/json",
    )
    assert second.status_code == 400, second.json()
    assert "already exists" in second.json()[field][0]
    assert ResultsDashboard.objects.count() == 1
    if kind == "media":
        with pytest.raises(ValidationError):
            MediaHouse(name="  EXAMPLE MEDIA  ").full_clean()


def test_sales_staff_find_an_aspirant_by_full_name(client, mca_candidates):
    sales = person("+254700000018", staff=True, admin=True, is_phone_verified=True)
    client.force_login(sales)
    wanted = mca_candidates[0]
    wanted.first_name, wanted.last_name = "Amina", "Governor"
    wanted.save()
    decoy = mca_candidates[1]
    decoy.first_name, decoy.last_name = "Amina", "Other"
    decoy.save()

    found = client.get(
        reverse("dashboard-access-options"), {"kind": "aspirant", "q": "amina gov"}
    ).json()["options"]

    assert [option["id"] for option in found] == [wanted.pk]
