from django.contrib import admin

from leaflet.admin import LeafletGeoAdmin

from stations.models import (
    Constituency,
    County,
    PollingCenter,
    PollingStation,
    Ward,
    PollingCenterVerification,
)


@admin.register(County)
class CountyAdmin(LeafletGeoAdmin):
    list_display = (
        "name",
        "number",
    )
    search_fields = ("name", "slug")
    ordering = ("number",)


@admin.register(Constituency)
class ConstituencyAdmin(LeafletGeoAdmin):
    list_display = ("name", "number", "county")
    search_fields = ("name",)
    list_filter = ("county",)
    ordering = ("number",)


@admin.register(Ward)
class WardAdmin(LeafletGeoAdmin):
    readonly_fields = ("number",)
    list_display = (
        "name",
        "number",
        "constituency",
        "constituency__county",
    )
    search_fields = ("name", "number")
    list_filter = ("constituency",)
    ordering = ("constituency__county",)


@admin.register(PollingCenter)
class PollingCenterAdmin(LeafletGeoAdmin):
    readonly_fields = ("code",)
    list_display = (
        "name",
        "code",
        "number_of_streams",
        "location_upvotes",
        "is_verified",
        "ward",
        "ward__constituency",
        "ward__constituency__county",
    )

    search_fields = (
        "name",
        "code",
        "ward__constituency__county__name",
        "ward__constituency__name",
    )
    list_filter = ("is_verified", "ward__constituency__county")
    ordering = ("ward__constituency__county",)


@admin.register(PollingStation)
class PollingStationAdmin(LeafletGeoAdmin):
    list_display = (
        "polling_center",
        "code",
        "stream_number",
        "polling_center__ward",
        "polling_center__ward__constituency",
        "polling_center__ward__constituency__county",
    )
    # customise fieldsets

    search_fields = (
        "polling_center__name",
        "code",
        "polling_center__ward__constituency__county__name",
        "polling_center__ward__constituency__name",
    )
    list_filter = ("polling_center",)
    ordering = ("polling_center__ward__constituency__county",)


@admin.register(PollingCenterVerification)
class PollingCenterVerificationAdmin(LeafletGeoAdmin):
    list_display = (
        "polling_center",
        "verified_by",
        "date_modified",
    )
    search_fields = ("polling_center__name",)
    list_filter = ("polling_center__ward__constituency__county",)
    autocomplete_fields = [
        "polling_center",
    ]

    # ordering = ("polling_center__ward__constituency__county",)
