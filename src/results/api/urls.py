from django.urls import path

from results.api.views import (
    PollingCenterPresidentialResultsAPIView,
    PollingCenterGovernorResultsAPIView,
    PollingCenterSenatorResultsAPIView,
    PollingCenterWomenRepResultsAPIView,
)

urlpatterns = [
    path(
        "polling-center/<int:ward_number>/<str:polling_center_code>/presidential/",
        PollingCenterPresidentialResultsAPIView.as_view(),
        name="presidential-results",
    ),
    path(
        "polling-center/<int:ward_number>/<str:polling_center_code>/governor/",
        PollingCenterGovernorResultsAPIView.as_view(),
        name="governor-results",
    ),
    path(
        "polling-center/<int:ward_number>/<str:polling_center_code>/senator/",
        PollingCenterSenatorResultsAPIView.as_view(),
        name="senator-results",
    ),
    path(
        "polling-center/<int:ward_number>/<str:polling_center_code>/women-rep/",
        PollingCenterWomenRepResultsAPIView.as_view(),
        name="women-rep-results",
    ),
]
