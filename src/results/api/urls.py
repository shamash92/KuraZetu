from django.urls import path

from results.api.agreement_views import (
    AgreementView,
    SharedPhotoView,
    StationUploadsView,
)
from results.api.county_views import CountyTotalResultsAPIView
from results.api.national_views import TotalPresResultsAPIView
from results.api.reading_views import (
    AgreeAfterReadingView,
    MarkedPhotoView,
    ReadPhotoView,
    ReadResultView,
)
from results.api.upload_views import ResultUploadPhotoView, ResultUploadView
from results.api.views import (
    PollingCenterGovernorResultsAPIView,
    PollingCenterMCAResultsAPIView,
    PollingCenterMpResultsAPIView,
    PollingCenterPresidentialResultsAPIView,
    PollingCenterSenatorResultsAPIView,
    PollingCenterWomenRepResultsAPIView,
    PollingStationCandidatesListAPIView,
    PollingStationLevelResultsAPIView,
    PollingStationPresidentialResultsAPIView,
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
    path(
        "polling-station/<str:polling_station_code>/presidential/",
        PollingStationPresidentialResultsAPIView.as_view(),
        name="polling-station-presidential-results",
    ),
    path(
        "polling-station/<str:polling_station_code>/results/<str:level>/",
        PollingStationLevelResultsAPIView.as_view(),
        name="polling-station-level-results",
    ),
    path(
        "polling-station/aspirants/<str:polling_station_code>/<str:level>/",
        PollingStationCandidatesListAPIView.as_view(),
        name="polling-station-candidates-list",
    ),
    path("uploads/", ResultUploadView.as_view(), name="result-uploads"),
    path(
        "read/",
        ReadPhotoView.as_view(),
        name="result-photo-reading",
    ),
    path(
        "read/<uuid:check_id>/",
        ReadResultView.as_view(),
        name="result-photo-reading-result",
    ),
    path(
        "read/<uuid:check_id>/agree/",
        AgreeAfterReadingView.as_view(),
        name="result-photo-agree",
    ),
    path(
        "read/<uuid:check_id>/marked-photo/",
        MarkedPhotoView.as_view(),
        name="result-photo-marked",
    ),
    path(
        "uploads/<uuid:upload_id>/photo/",
        ResultUploadPhotoView.as_view(),
        name="result-upload-photo",
    ),
    path(
        "uploads/<uuid:upload_id>/photo/full/",
        ResultUploadPhotoView.as_view(full=True),
        name="result-upload-photo-full",
    ),
    path(
        "polling-station/<str:polling_station_code>/uploads/<str:level>/",
        StationUploadsView.as_view(),
        name="polling-station-uploads",
    ),
    path(
        "uploads/<uuid:upload_id>/shared-photo/",
        SharedPhotoView.as_view(),
        name="result-upload-shared-photo",
    ),
    path("agreements/", AgreementView.as_view(), name="result-agreements"),
]
