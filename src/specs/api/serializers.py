from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from specs.models import Specification


class LibraryEntrySerializer(serializers.ModelSerializer):
    """One specification as the library shows it.

    Expects rows from ``Specification.objects.discoverable_by``.
    """

    title = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    access = serializers.SerializerMethodField()

    class Meta:
        model = Specification
        fields = ("slug", "title", "summary", "access", "archived")

    def get_title(self, spec) -> str:
        if spec.can_read:
            return spec.current_revision.title
        return spec.safe_listing_title

    def get_summary(self, spec) -> str:
        if spec.can_read:
            return spec.current_revision.summary
        return spec.safe_listing_summary

    def get_access(self, spec) -> str:
        return "full" if spec.can_read else "locked"


class SpecificationPageSerializer(LibraryEntrySerializer):
    """A specification the person may read, with its current revision."""

    body = serializers.CharField(source="current_revision.body")
    published_at = serializers.DateTimeField(source="current_revision.published_at")
    superseded_by = serializers.SerializerMethodField()

    class Meta(LibraryEntrySerializer.Meta):
        fields = LibraryEntrySerializer.Meta.fields + (
            "body",
            "published_at",
            "superseded_by",
        )

    @extend_schema_field(LibraryEntrySerializer(allow_null=True))
    def get_superseded_by(self, spec):
        successor = (
            Specification.objects.discoverable_by(self.context["request"].user)
            .filter(pk=spec.superseded_by_id)
            .select_related("current_revision")
            .first()
        )
        return LibraryEntrySerializer(successor).data if successor else None
