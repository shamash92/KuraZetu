from django.urls import path

from results.api.county_views import CountyTotalResultsAPIView
from results.api.national_views import TotalPresResultsAPIView
from results.api.views import (
    PollingCenterGovernorResultsAPIView,
    PollingCenterMCAResultsAPIView,
    PollingCenterMpResultsAPIView,
    PollingCenterPresidentialResultsAPIView,
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
    path(
        "polling-center/<int:ward_number>/<str:polling_center_code>/mp/",
        PollingCenterMpResultsAPIView.as_view(),
        name="mp-results",
    ),
    path(
        "polling-center/<int:ward_number>/<str:polling_center_code>/mca/",
        PollingCenterMCAResultsAPIView.as_view(),
        name="mca-results",
    ),
    path(
        "total-votes/presidential/",
        TotalPresResultsAPIView.as_view(),
        name="total-votes",
    ),
    # county apis
    path(
        "county/<str:level>/",
        CountyTotalResultsAPIView.as_view(),
        name="county-presidential-results",
    ),
]
