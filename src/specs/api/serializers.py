import secrets
import string

from drf_spectacular.utils import extend_schema_field
from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers

from specs.models import AccessPolicy, DocumentSet, Revision, Specification, Stage

ADDRESS_ALPHABET = string.ascii_lowercase + string.digits


def new_address(model=Specification, prefix="kz-"):
    """An address that says nothing about what it names.

    Random rather than numbered, so that a gap between two addresses a
    person can see does not show that a concealed specification exists.
    """
    while True:
        slug = prefix + "".join(secrets.choice(ADDRESS_ALPHABET) for _ in range(6))
        if not model.objects.filter(slug=slug).exists():
            return slug


class DocumentSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentSet
        fields = ("slug", "title", "summary", "ordered")
        read_only_fields = ("slug",)

    def create(self, validated_data):
        return super().create(
            {**validated_data, "slug": new_address(DocumentSet, "set-")}
        )


class LibraryEntrySerializer(serializers.ModelSerializer):
    """One specification as the library shows it.

    Expects rows from ``Specification.objects.discoverable_by``.
    """

    title = serializers.SerializerMethodField()
    stage = serializers.SerializerMethodField()
    document_set = DocumentSetSerializer(read_only=True)
    summary = serializers.SerializerMethodField()
    access = serializers.SerializerMethodField()
    published_at = serializers.SerializerMethodField()

    class Meta:
        model = Specification
        fields = (
            "slug",
            "title",
            "summary",
            "access",
            "archived",
            "published_at",
            "stage",
            "document_set",
        )

    def get_title(self, spec) -> str:
        if spec.can_read:
            return spec.current_revision.title
        return spec.safe_listing_title

    def get_summary(self, spec) -> str:
        if spec.can_read:
            return spec.current_revision.summary
        return spec.safe_listing_summary

    @extend_schema_field(serializers.ChoiceField(Stage.choices, allow_null=True))
    def get_stage(self, spec):
        return spec.stage if spec.can_read else None

    def get_access(self, spec) -> str:
        return "full" if spec.can_read else "locked"

    @extend_schema_field(serializers.DateTimeField(allow_null=True))
    def get_published_at(self, spec):
        # Part of the revision history, so not for a person who cannot read it.
        if not spec.can_read:
            return None
        return serializers.DateTimeField().to_representation(
            spec.current_revision.published_at
        )


class SpecificationPageSerializer(LibraryEntrySerializer):
    """A specification the person may read, with its current revision."""

    body = serializers.CharField(source="current_revision.body")
    superseded_by = serializers.SerializerMethodField()

    class Meta(LibraryEntrySerializer.Meta):
        fields = LibraryEntrySerializer.Meta.fields + ("body", "superseded_by")

    @extend_schema_field(LibraryEntrySerializer(allow_null=True))
    def get_superseded_by(self, spec):
        successor = (
            Specification.objects.discoverable_by(self.context["request"].user)
            .filter(pk=spec.superseded_by_id)
            .select_related("current_revision")
            .first()
        )
        return LibraryEntrySerializer(successor).data if successor else None


class AuthorLibraryEntrySerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="draft_title", max_length=200)
    published = serializers.SerializerMethodField()

    class Meta:
        model = Specification
        fields = (
            "slug",
            "title",
            "access_policy",
            "published",
            "has_unpublished_changes",
            "archived",
        )
        read_only_fields = ("slug", "access_policy", "archived")

    def get_published(self, spec) -> bool:
        return spec.current_revision_id is not None

    def create(self, validated_data):
        return super().create({**validated_data, "slug": new_address()})


class RevisionSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Revision
        fields = ("sequence", "title", "published_at")


class RevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Revision
        fields = ("sequence", "title", "summary", "body", "published_at")


class AuthorSpecificationSerializer(AuthorLibraryEntrySerializer):
    """Everything an author edits, except the access policy and reader list.

    Those change who can see the specification, so each has its own action.
    """

    summary = serializers.CharField(
        source="draft_summary", allow_blank=True, required=False
    )
    # Markdown is kept exactly as written: leading and trailing whitespace can
    # be part of it.
    body = serializers.CharField(
        source="draft_body", allow_blank=True, required=False, trim_whitespace=False
    )
    superseded_by = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Specification.objects.all(),
        allow_null=True,
        required=False,
    )
    document_set = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=DocumentSet.objects.all(),
        allow_null=True,
        required=False,
    )
    readers = serializers.SerializerMethodField()
    revisions = serializers.SerializerMethodField()

    class Meta(AuthorLibraryEntrySerializer.Meta):
        fields = AuthorLibraryEntrySerializer.Meta.fields + (
            "summary",
            "body",
            "safe_listing_title",
            "safe_listing_summary",
            "superseded_by",
            "document_set",
            "position",
            "stage",
            "readers",
            "revisions",
        )
        read_only_fields = ("slug", "access_policy", "position")

    def get_readers(self, spec) -> list[str]:
        return [str(reader.phone_number) for reader in spec.readers.all()]

    @extend_schema_field(RevisionSummarySerializer(many=True))
    def get_revisions(self, spec):
        return RevisionSummarySerializer(
            spec.revisions.order_by("-sequence"), many=True
        ).data

    def update(self, spec, validated_data):
        # A specification that joins a set comes last in it. Its place is
        # changed only by rearranging the set.
        if "document_set" in validated_data:
            document_set = validated_data.pop("document_set")
            if document_set != spec.document_set:
                spec.join(document_set)
        return super().update(spec, validated_data)

    def validate(self, attrs):
        spec = self.instance
        if attrs.get("superseded_by") == spec:
            raise serializers.ValidationError(
                {"superseded_by": "A specification cannot supersede itself."}
            )
        if (
            spec.access_policy == AccessPolicy.RESTRICTED_LISTED
            and not attrs.get("safe_listing_title", spec.safe_listing_title).strip()
        ):
            raise serializers.ValidationError(
                {"safe_listing_title": "A listed specification needs a safe title."}
            )
        return attrs


class DocumentSetOrderSerializer(serializers.Serializer):
    specifications = serializers.ListField(child=serializers.SlugField())

    def validate_specifications(self, slugs):
        members = set(
            self.context["document_set"].specifications.values_list("slug", flat=True)
        )
        if len(set(slugs)) != len(slugs) or not set(slugs) <= members:
            raise serializers.ValidationError(
                "Name each specification once, and only members of this set."
            )
        return slugs


class AccessPolicyChangeSerializer(serializers.Serializer):
    access_policy = serializers.ChoiceField(choices=AccessPolicy.choices)
    confirm_widening = serializers.BooleanField(default=False)


class ReaderSerializer(serializers.Serializer):
    phone_number = PhoneNumberField()
