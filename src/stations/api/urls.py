from django.urls import path

from stations.api.views import (
    ConstituenciesBoundariesListAPIView,
    CountiesBoundariesListAPIView,
    WardBoundariesListAPIView,
    WardPollingCenterFromLocationListAPIView,
    WardPollingCenterListAPIView,
    RandomUnverifiedPollingCenterAPIView,
    VerificationPollingCenterAPIView,
    PartiallyVerifiedPollingCenterAPIView,
)

urlpatterns = [
    path(
        "counties/boundaries/",
        CountiesBoundariesListAPIView.as_view(),
        name="county_boundaries_api",
    ),
    path(
        "county/<str:county_number>/constituencies/boundaries/",
        ConstituenciesBoundariesListAPIView.as_view(),
        name="constituencies_boundaries_api",
    ),
    path(
        "constituencies/<int:constituency_number>/wards/boundaries/",
        WardBoundariesListAPIView.as_view(),
        name="ward_boundaries_api",
    ),
    path(
        "wards/<int:ward_number>/polling-centers/pins/",
        WardPollingCenterListAPIView.as_view(),
        name="polling_centers_pins_api",
    ),
    path(
        "ward/polling-centers/<int:distance_meters>/pins/",
        WardPollingCenterFromLocationListAPIView.as_view(),
        name="polling_centers_from_user_location_pins_api",
    ),
    path(
        "polling-centers/unverified/random/<str:admin_level>/",
        RandomUnverifiedPollingCenterAPIView.as_view(),
        name="random_unverified_polling_centers_api",
    ),
    path(
        "polling-centers/verify/",
        VerificationPollingCenterAPIView.as_view(),
        name="polling_centers_verification_api",
    ),
    path(
        "polling-centers/partially-verified/",
        PartiallyVerifiedPollingCenterAPIView.as_view(),
        name="polling_centers_partially_verified_api",
    ),
]
