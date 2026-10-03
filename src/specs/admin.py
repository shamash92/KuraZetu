from django.contrib import admin

from .models import AuthorGrant, Record


# Specifications and revisions are deliberately not registered: admin access
# is not an author grant and must not open restricted text.
@admin.register(AuthorGrant)
class AuthorGrantAdmin(admin.ModelAdmin):
    raw_id_fields = ("user",)


@admin.register(Record)
class RecordAdmin(admin.ModelAdmin):
    list_display = ("at", "action", "specification", "detail")
    list_filter = ("action",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
