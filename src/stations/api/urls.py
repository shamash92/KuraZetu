from django.urls import path

from stations.api.views import (
    ConstituenciesBoundariesListAPIView,
    CountiesBoundariesListAPIView,
    WardBoundariesListAPIView,
    WardPollingCenterFromLocationListAPIView,
    WardPollingCenterListAPIView,
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
]
