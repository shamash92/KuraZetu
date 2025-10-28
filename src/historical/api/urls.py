from django.urls import path
from historical.api.views import (
    PresidentialResultsByCountyAndYearView,
    GovernorResultsByCountyAndYearView,
    SenatorResultsByCountyAndYearView,
    WomenRepResultsByCountyAndYearView,
    MPResultsByConstituencyAndYearView,
    MCAResultsByWardAndYearView,
)

urlpatterns = [
    path(
        "presidential/<int:year>/<int:county_number>/",
        PresidentialResultsByCountyAndYearView.as_view(),
        name="presidential-results-by-county",
    ),
    path(
        "governor/<int:year>/<int:county_number>/",
        GovernorResultsByCountyAndYearView.as_view(),
        name="governor-results-by-county",
    ),
    path(
        "senator/<int:year>/<int:county_number>/",
        SenatorResultsByCountyAndYearView.as_view(),
        name="senator-results-by-county",
    ),
    path(
        "women-rep/<int:year>/<int:county_number>/",
        WomenRepResultsByCountyAndYearView.as_view(),
        name="women-rep-results-by-county",
    ),
    path(
        "mp/<int:year>/<int:constituency_number>/",
        MPResultsByConstituencyAndYearView.as_view(),
        name="mp-results-by-constituency",
    ),
    path(
        "mca/<int:year>/<int:ward_number>/",
        MCAResultsByWardAndYearView.as_view(),
        name="mca-results-by-ward",
    ),
]
