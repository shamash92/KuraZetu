from django.contrib import admin

from leaflet.admin import LeafletGeoAdmin

from stations.models import Constituency, County, Ward


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
        "constituency__county",
    )
    search_fields = ("name", "number")
    list_filter = ("constituency",)
    ordering = ("number",)
