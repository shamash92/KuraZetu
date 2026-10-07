from django.contrib import admin

from .models import AccessPolicy, AuthorGrant, Record


# Specifications and revisions are deliberately not registered: admin access
# is not an author grant and must not open restricted text.
@admin.register(AuthorGrant)
class AuthorGrantAdmin(admin.ModelAdmin):
    raw_id_fields = ("user",)


@admin.register(Record)
class RecordAdmin(admin.ModelAdmin):
    list_display = ("title", "action", "detail")
    list_filter = ("action",)
    list_select_related = ("specification__current_revision",)

    # Admin access is not an author grant, so a restricted specification is
    # named here the way the library names it to a person who cannot read it.
    @admin.display(description="Specification")
    def title(self, record):
        spec = record.specification
        if spec is None:
            return None
        if spec.access_policy == AccessPolicy.PUBLIC and spec.current_revision:
            return spec.current_revision.title
        return spec.safe_listing_title or "Restricted specification"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
