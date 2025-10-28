from django.contrib import admin

from historical.models import (
    PresidentialResults,
    Aspirant2017,
    GovernorResults,
    SenatorResults,
    WomenRepResults,
    MPResults,
    MCAResults,
)


class PresidentialResultsAdmin(admin.ModelAdmin):
    list_display = ("county", "aspirant", "aspirant_votes")
    list_filter = ("county",)


admin.site.register(PresidentialResults, PresidentialResultsAdmin)


class Aspirant2017Admin(admin.ModelAdmin):
    list_display = (
        "first_name",
        "last_name",
        "surname",
        "party",
        "level",
        "is_running_mate",
        "county",
        "constituency",
        "ward",
    )
    list_filter = ("county", "constituency", "party", "level")


admin.site.register(Aspirant2017, Aspirant2017Admin)


class GovernorResultsAdmin(admin.ModelAdmin):
    list_display = ("county", "aspirant", "running_mate", "aspirant_votes")
    list_filter = ("county",)


admin.site.register(GovernorResults, GovernorResultsAdmin)


class SenatorResultsAdmin(admin.ModelAdmin):
    list_display = ("county", "aspirant", "aspirant_votes")
    list_filter = ("county",)


admin.site.register(SenatorResults, SenatorResultsAdmin)


class WomenRepResultsAdmin(admin.ModelAdmin):
    list_display = ("county", "aspirant", "aspirant_votes")
    list_filter = ("county",)


admin.site.register(WomenRepResults, WomenRepResultsAdmin)


class MPResultsAdmin(admin.ModelAdmin):
    list_display = ("constituency", "aspirant", "aspirant_votes")
    list_filter = ("constituency",)


admin.site.register(MPResults, MPResultsAdmin)


class MCAResultsAdmin(admin.ModelAdmin):
    list_display = ("ward", "aspirant", "aspirant_votes")
    list_filter = ("ward",)


admin.site.register(MCAResults, MCAResultsAdmin)
