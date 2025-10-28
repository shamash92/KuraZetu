from django.contrib import admin

from historical.models import PresidentialResults,Aspirant2017,GovernorResults

class PresidentialResultsAdmin(admin.ModelAdmin):
    list_display = ('county', 'aspirant', 'aspirant_votes' )
    list_filter = ('county',)

admin.site.register(PresidentialResults,PresidentialResultsAdmin)


class Aspirant2017Admin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'surname', 'party', 'level', "is_running_mate", 'county', 'constituency', 'ward' )
    list_filter = ('county', 'party', 'level')

admin.site.register(Aspirant2017,Aspirant2017Admin)

class GovernorResultsAdmin(admin.ModelAdmin):
    list_display = ('county', 'aspirant', 'running_mate', 'aspirant_votes' )
    list_filter = ('county',)

admin.site.register(GovernorResults,GovernorResultsAdmin)
