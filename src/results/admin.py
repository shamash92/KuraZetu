from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.urls import path, reverse
from django.utils.html import format_html, format_html_join

from accounts.admin import KeptContributionAdmin
from results.models import (
    Aspirant,
    Party,
    PollingStationGovernorResults,
    PollingStationMCAResults,
    PollingStationMpResults,
    PollingStationPresidentialExtras,
    PollingStationPresidentialResults,
    PollingStationSenatorResults,
    PollingStationWomenRepResults,
    ResultUpload,
)


class AspirantAdmin(KeptContributionAdmin, admin.ModelAdmin):
    list_display = (
        "first_name",
        "last_name",
        "party",
        "level",
        "county",
        "constituency",
        "ward",
        "is_verified",
    )
    search_fields = (
        "first_name",
        "last_name",
        "surname",
        "party__name",
        "level",
        "county__name",
        "constituency__name",
        "ward__name",
    )
    list_filter = ("is_verified", "level", "party", "county", "constituency", "ward")
    autocomplete_fields = ["constituency", "ward"]

    ordering = ("-is_verified",)


admin.site.register(Aspirant, AspirantAdmin)


class PartyAdmin(KeptContributionAdmin, admin.ModelAdmin):
    list_display = ("name", "short_name", "is_verified", "party_colour_hex")
    search_fields = ("name", "short_name")
    list_filter = ("is_verified",)
    ordering = ("-is_verified",)


admin.site.register(Party, PartyAdmin)


class PollingStationPresidentialResultsAdmin(KeptContributionAdmin, admin.ModelAdmin):
    account_link = "added_by"
    list_display = (
        "polling_station",
        "presidential_candidate",
        "votes",
        "is_verified",
    )
    autocomplete_fields = ["polling_station"]
    search_fields = (
        "polling_station__polling_center__name",
        "presidential_candidate__first_name",
        "presidential_candidate__last_name",
    )
    list_filter = (
        "is_verified",
        "polling_station__polling_center__ward__constituency__county",
    )
    ordering = ("-is_verified",)


admin.site.register(
    PollingStationPresidentialResults,
    PollingStationPresidentialResultsAdmin,
)


class PollingStationPresidentialExtrasAdmin(KeptContributionAdmin, admin.ModelAdmin):
    account_link = "added_by"

    list_display = (
        "polling_station",
        "rejected_votes",
        "rejected_objected_to_votes",
        "disputed_votes",
        "valid_votes_cast",
        "is_verified",
        "account",
    )

    autocomplete_fields = [
        "polling_station",
    ]
    search_fields = ("polling_station__polling_center__name", "added_by")
    list_filter = ("is_verified",)
    # ordering = ("-is_verified",)


admin.site.register(
    PollingStationPresidentialExtras,
    PollingStationPresidentialExtrasAdmin,
)


class PollingStationGovernorResultsAdmin(admin.ModelAdmin):
    # raw_id_fields = [
    #     "polling_station",
    # ]
    autocomplete_fields = ["polling_station", "governor_candidate"]

    list_display = (
        "polling_station",
        "governor_candidate",
        "votes",
    )


admin.site.register(
    PollingStationGovernorResults,
    PollingStationGovernorResultsAdmin,
)


class PollingStationSenatorResultsAdmin(admin.ModelAdmin):
    autocomplete_fields = ["polling_station", "senator_candidate"]

    list_display = (
        "polling_station",
        "senator_candidate",
        "votes",
    )
    search_fields = (
        "polling_station__polling_center__name",
        "senator_candidate__first_name",
        "senator_candidate__last_name",
    )


admin.site.register(
    PollingStationSenatorResults,
    PollingStationSenatorResultsAdmin,
)


class PollingStationWomenRepResultsAdmin(admin.ModelAdmin):
    autocomplete_fields = ["polling_station", "woman_rep_candidate"]

    list_display = (
        "polling_station",
        "woman_rep_candidate",
        "votes",
    )
    search_fields = (
        "polling_station__polling_center__name",
        "woman_rep_candidate__first_name",
    )


admin.site.register(
    PollingStationWomenRepResults,
    PollingStationWomenRepResultsAdmin,
)


class PollingStationMpResultsAdmin(admin.ModelAdmin):
    autocomplete_fields = ["polling_station"]

    list_display = (
        "polling_station",
        "mp_candidate",
        "votes",
    )
    search_fields = (
        "polling_station__polling_center__name",
        "mp_candidate__first_name",
        "mp_candidate__last_name",
    )


admin.site.register(
    PollingStationMpResults,
    PollingStationMpResultsAdmin,
)


class PollingStationMCAResultsAdmin(admin.ModelAdmin):
    autocomplete_fields = ["polling_station"]

    list_display = (
        "polling_station",
        "mca_candidate",
        "votes",
    )
    search_fields = (
        "polling_station__polling_center__name",
        "mca_candidate__first_name",
        "mca_candidate__last_name",
    )


admin.site.register(
    PollingStationMCAResults,
    PollingStationMCAResultsAdmin,
)


@admin.register(ResultUpload)
class ResultUploadAdmin(admin.ModelAdmin):
    """Uploads, read-only. The uploader's account and position are not shown."""

    list_display = (
        "created_at",
        "polling_station",
        "race",
        "location_grade",
        "distance_to_centre_m",
        "fix_accuracy_m",
        "quality_checked",
        "is_current",
    )
    list_filter = (
        "race",
        "location_grade",
        "quality_checked",
        "polling_station__polling_center__ward__constituency__county",
    )
    search_fields = ("polling_station__code", "polling_station__polling_center__name")
    list_select_related = ("polling_station__polling_center",)
    ordering = ("-created_at",)
    fields = (
        "id",
        "polling_station",
        "race",
        "tally",
        "rejected_votes",
        "disputed_votes",
        "location_grade",
        "distance_to_centre_m",
        "fix_accuracy_m",
        "quality_checked",
        "captured_at",
        "created_at",
        "is_current",
        "photo_links",
    )
    readonly_fields = fields

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description="Tally")
    def tally(self, upload):
        names = {
            str(aspirant.id): f"{aspirant.first_name} {aspirant.last_name}"
            for aspirant in Aspirant.objects.filter(pk__in=upload.votes)
        }
        return format_html_join(
            "",
            "<div>{}: {}</div>",
            ((names.get(key, key), votes) for key, votes in upload.votes.items()),
        )

    @admin.display(description="Photo")
    def photo_links(self, upload):
        def link(which, label):
            url = reverse("admin:results_resultupload_photo", args=[upload.id, which])
            return format_html('<a href="{}" target="_blank">{}</a>', url, label)

        if not upload.preview:
            return link("full", "Photo")
        return format_html(
            "{} · {}", link("preview", "Preview"), link("full", "Full photo")
        )

    def get_urls(self):
        return [
            path(
                "<uuid:upload_id>/photo/<str:which>/",
                self.admin_site.admin_view(self.photo_view),
                name="results_resultupload_photo",
            ),
        ] + super().get_urls()

    def photo_view(self, request, upload_id, which):
        """The photo is private storage, so staff get it through the server."""
        if not self.has_view_permission(request):
            raise PermissionDenied
        if which not in ("full", "preview"):
            raise Http404
        upload = get_object_or_404(ResultUpload, pk=upload_id)
        stored = (
            upload.preview if which == "preview" and upload.preview else upload.photo
        )
        response = FileResponse(stored.open("rb"), content_type="image/jpeg")
        response["Cache-Control"] = "private, no-store"
        return response
