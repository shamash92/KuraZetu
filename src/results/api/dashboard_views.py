"""A custom dashboard's results, limited to its race and area."""

from django.http import Http404

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import WEB_AND_NATIVE_AUTHENTICATION
from results.dashboard_access import active_dashboard, may_manage, may_onboard
from results.dashboard_results import dashboard_payload, station_rows


class DashboardView(APIView):
    authentication_classes = WEB_AND_NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "private, no-store"
        return response


class DashboardContextView(DashboardView):
    """Which results view the signed-in person gets."""

    def get(self, request):
        dashboard = active_dashboard(request.user)
        return Response(
            {
                "dashboard": (
                    {"id": dashboard.pk, "name": dashboard.name, "kind": dashboard.kind}
                    if dashboard
                    else None
                ),
                "manage_url": (
                    f"/ui/dashboards/{dashboard.pk}/access/"
                    if dashboard and may_manage(request.user, dashboard)
                    else None
                ),
                "onboarding_url": (
                    "/ui/dashboards/onboarding/" if may_onboard(request.user) else None
                ),
            }
        )


class DashboardResultsView(DashboardView):
    build = staticmethod(dashboard_payload)

    def get(self, request):
        dashboard = active_dashboard(request.user)
        if dashboard is None:
            raise Http404
        try:
            pk = (
                int(request.query_params["id"])
                if "id" in request.query_params
                else None
            )
        except ValueError:
            raise Http404
        return Response(self.build(dashboard, request.query_params.get("area"), pk))


class DashboardStationsView(DashboardResultsView):
    """The polling stations inside one area of the dashboard."""

    build = staticmethod(station_rows)
