"""Web dashboard onboarding and owner-managed viewers."""

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import mask_phone_number
from results.dashboard_access import add_member, may_manage, may_onboard
from results.dashboard_forms import DashboardForm, ViewerForm
from results.dashboard_models import MediaHouse, ResultsDashboard
from results.models import Aspirant, Party


class SalesPermission(BasePermission):
    def has_permission(self, request, view):
        return may_onboard(request.user)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class AccessView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "private, no-store"
        return response

    def managed_dashboard(self, request, pk, *, lock=False):
        query = (
            ResultsDashboard.objects.select_for_update()
            if lock
            else ResultsDashboard.objects
        )
        dashboard = get_object_or_404(query, pk=pk)
        if not may_manage(request.user, dashboard):
            raise PermissionDenied
        return dashboard


def aspirant_label(name_parts, level, area, party):
    name = " ".join(part for part in name_parts if part)
    office = dict(Aspirant.LEVEL_CHOICES)[level]
    return f"{name} · {office} · {area or 'National'} · {party}"


def detail(dashboard, user):
    sales = may_onboard(user)
    members = list(dashboard.members.order_by("-is_owner", "created_at"))
    owner = next((member for member in members if member.is_owner), None)
    target = (
        dashboard.aspirant
        if dashboard.aspirant_id
        else dashboard.party if dashboard.party_id else dashboard.media_house
    )
    label = (
        aspirant_label(
            (target.first_name, target.last_name, target.surname),
            target.level,
            getattr(target.county or target.constituency or target.ward, "name", None),
            target.party.name,
        )
        if dashboard.aspirant_id
        else str(target)
    )
    return {
        "id": dashboard.pk,
        "name": dashboard.name,
        "kind": dashboard.kind,
        "active": dashboard.active,
        "can_edit": sales,
        "owner_phone": str(owner.phone_number) if sales and owner else None,
        "target": {"id": target.pk, "label": label} if target else None,
        "members": [
            {
                "id": member.pk,
                "phone": mask_phone_number(member.phone_number),
                "owner": member.is_owner,
                "status": (
                    "Verified account" if member.user_id else "Awaiting verified signup"
                ),
            }
            for member in members
        ],
    }


def save_settings(data, *, instance=None):
    kind = instance.kind if instance else data.get("kind")
    if kind not in ResultsDashboard.Kind.values:
        return None, {"kind": ["Choose Aspirant, Political party, or Media."]}
    form = DashboardForm(data, instance=instance, kind=kind)
    if not form.is_valid():
        return None, form.errors
    dashboard = form.save()
    add_member(dashboard, form.cleaned_data["owner_phone"], owner=True)
    return dashboard, None


class DashboardPermissionView(AccessView):
    permission_classes = [IsAuthenticated, SalesPermission]

    def get(self, request):
        return Response({"allowed": True})


class DashboardCreateView(AccessView):
    permission_classes = [IsAuthenticated, SalesPermission]

    def post(self, request):
        try:
            with transaction.atomic():
                dashboard, errors = save_settings(request.data)
                if errors:
                    return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as error:
            return Response({"detail": error.messages[0]}, status=400)
        except IntegrityError:
            return Response(
                {
                    "detail": "This record or phone number already has a dashboard assignment."
                },
                status=409,
            )
        return Response({"id": dashboard.pk}, status=status.HTTP_201_CREATED)


class DashboardOptionsView(AccessView):
    permission_classes = [IsAuthenticated, SalesPermission]

    def get(self, request):
        term = request.query_params.get("q", "").strip()[:100]
        kind = request.query_params.get("kind")
        if kind not in ("aspirant", "party", "media") or len(term) < 2:
            return Response({"options": [], "has_more": False})
        if kind == "aspirant":
            # Every typed word must match one of the fields, so a full name works.
            words = Q()
            for word in term.split():
                words &= (
                    Q(first_name__icontains=word)
                    | Q(last_name__icontains=word)
                    | Q(surname__icontains=word)
                    | Q(party__name__icontains=word)
                )
            matches = list(
                Aspirant.objects.filter(words)
                .order_by("last_name", "first_name", "pk")
                .values(
                    "id",
                    "first_name",
                    "last_name",
                    "surname",
                    "level",
                    "party__name",
                    "county__name",
                    "constituency__name",
                    "ward__name",
                )[:26]
            )
            options = [
                {
                    "id": item["id"],
                    "label": aspirant_label(
                        (item["first_name"], item["last_name"], item["surname"]),
                        item["level"],
                        item["county__name"]
                        or item["constituency__name"]
                        or item["ward__name"],
                        item["party__name"],
                    ),
                }
                for item in matches
            ]
        elif kind == "party":
            matches = list(
                Party.objects.filter(
                    Q(name__icontains=term) | Q(short_name__icontains=term)
                )
                .order_by("name", "pk")
                .values("id", "name", "short_name")[:26]
            )
            options = [
                {"id": item["id"], "label": f'{item["name"]} ({item["short_name"]})'}
                for item in matches
            ]
        else:
            options = list(
                MediaHouse.objects.filter(name__icontains=term)
                .order_by("name", "pk")
                .values("id", "name")[:26]
            )
            options = [{"id": item["id"], "label": item["name"]} for item in options]
        return Response({"options": options[:25], "has_more": len(options) > 25})


class DashboardDetailView(AccessView):
    def get(self, request, pk):
        return Response(detail(self.managed_dashboard(request, pk), request.user))

    def patch(self, request, pk):
        if not may_onboard(request.user):
            raise PermissionDenied
        try:
            with transaction.atomic():
                dashboard = self.managed_dashboard(request, pk, lock=True)
                dashboard, errors = save_settings(request.data, instance=dashboard)
                if errors:
                    return Response(errors, status=400)
        except ValidationError as error:
            return Response({"detail": error.messages[0]}, status=400)
        except IntegrityError:
            return Response(
                {
                    "detail": "This record or phone number already has a dashboard assignment."
                },
                status=409,
            )
        return Response(detail(dashboard, request.user))


class DashboardMembersView(AccessView):
    def post(self, request, pk):
        form = ViewerForm(request.data)
        try:
            with transaction.atomic():
                dashboard = self.managed_dashboard(request, pk, lock=True)
                if not form.is_valid():
                    return Response(form.errors, status=400)
                add_member(dashboard, form.cleaned_data["phone_number"])
        except ValidationError as error:
            return Response({"detail": error.messages[0]}, status=400)
        except IntegrityError:
            return Response(
                {"detail": "This phone number already has a dashboard assignment."},
                status=409,
            )
        return Response(detail(dashboard, request.user), status=201)

    def delete(self, request, pk, member_id):
        with transaction.atomic():
            dashboard = self.managed_dashboard(request, pk, lock=True)
            member = get_object_or_404(dashboard.members, pk=member_id)
            if member.is_owner:
                return Response(
                    {
                        "detail": "Assign a replacement owner before removing this person."
                    },
                    status=400,
                )
            member.delete()
        return Response(detail(dashboard, request.user))
