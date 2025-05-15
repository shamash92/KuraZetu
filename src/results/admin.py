from django.contrib import admin

from results.models import (
    Aspirant,
    Party,
    PollingStationGovernorResults,
    PollingStationMCAResults,
    PollingStationMpResults,
    PollingStationPresidentialResults,
    PollingStationSenatorResults,
    PollingStationWomenRepResults,
)


class AspirantAdmin(admin.ModelAdmin):
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


class PartyAdmin(admin.ModelAdmin):
    list_display = ("name", "short_name", "is_verified", "party_colour_hex")
    search_fields = ("name", "short_name")
    list_filter = ("is_verified",)
    ordering = ("-is_verified",)


admin.site.register(Party, PartyAdmin)


class PollingStationPresidentialResultsAdmin(admin.ModelAdmin):
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
    autocomplete_fields = ["polling_station"]

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
    autocomplete_fields = ["polling_station"]

    list_display = (
        "polling_station",
        "woman_rep_candidate",
        "votes",
    )
    search_fields = (
        "polling_station__polling_center__name",
        "women_rep_candidate__first_name",
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
