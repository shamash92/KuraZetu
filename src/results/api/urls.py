from django.urls import path

from results.api.views import (
    PollingCenterGovernorResultsDetailAPIView,
    PollingCenterPresidentialResultsAPIView,
)

urlpatterns = [
    path(
        "polling-center/<int:ward_number>/<str:polling_center_code>/presidential/",
        PollingCenterPresidentialResultsAPIView.as_view(),
        name="presidential-results",
    ),
    path(
        "polling-center/<int:ward_number>/<str:polling_center_code>/governor/",
        PollingCenterGovernorResultsDetailAPIView.as_view(),
        name="governor-results",
    ),
]
