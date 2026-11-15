"""Resolve one verified phone's assignment; never infer access from a role."""

from django.core.exceptions import ValidationError
from django.db import transaction

from accounts.models import User
from results.dashboard_models import DashboardMember, ResultsDashboard


def may_onboard(user):
    return (
        user.is_authenticated
        and user.is_active
        and user.is_staff
        and user.has_perm("results.manage_dashboards")
    )


def membership(user):
    if not user.is_authenticated or not user.is_active or not user.is_phone_verified:
        return None
    return (
        DashboardMember.objects.select_related(
            "dashboard__aspirant", "dashboard__party"
        )
        .filter(phone_number=user.phone_number)
        .first()
    )


def active_dashboard(user):
    member = membership(user)
    return member.dashboard if member and member.dashboard.active else None


def may_manage(user, dashboard):
    if may_onboard(user):
        return True
    member = membership(user)
    return bool(
        dashboard.active
        and member
        and member.dashboard_id == dashboard.pk
        and member.is_owner
    )


@transaction.atomic
def add_member(dashboard, phone, *, owner=False):
    # Serializes membership changes against activation and ownership changes.
    ResultsDashboard.objects.select_for_update().get(pk=dashboard.pk)
    member = DashboardMember.objects.filter(phone_number=phone).first()
    if member and member.dashboard_id != dashboard.pk:
        raise ValidationError(
            "This number already has a dashboard assignment. Remove it there before assigning it here."
        )
    user = User.objects.filter(phone_number=phone, is_phone_verified=True).first()
    if owner:
        dashboard.members.filter(is_owner=True).update(is_owner=False)
    if member:
        member.user = user
        member.is_owner = owner or member.is_owner
        member.save(update_fields=["user", "is_owner"])
    else:
        member = DashboardMember.objects.create(
            dashboard=dashboard, phone_number=phone, user=user, is_owner=owner
        )
    return member
