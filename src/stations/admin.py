from django.contrib import admin
from stations.models import County, Constituency, Ward

from leaflet.admin import LeafletGeoAdmin


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
    list_display = (
        "name",
        "number",
        "constituency",
    )
    search_fields = ("name",)
    list_filter = ("constituency",)
    ordering = ("number",)
