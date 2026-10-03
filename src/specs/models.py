from django.conf import settings
from django.db import models
from django.db.models import Exists, OuterRef, Q


class AccessPolicy(models.TextChoices):
    PUBLIC = "PUBLIC"
    RESTRICTED_LISTED = "RESTRICTED_LISTED"
    RESTRICTED_CONCEALED = "RESTRICTED_CONCEALED"


class SpecificationQuerySet(models.QuerySet):
    """The access policy. Views must start from ``discoverable_by``."""

    def discoverable_by(self, user):
        """Specifications the person may know exist.

        Each row carries ``can_read``. When it is false the person may see
        the safe listing metadata and nothing else.
        """
        can_read = Q(access_policy=AccessPolicy.PUBLIC)
        if user.is_authenticated:
            on_reader_list = Specification.readers.through.objects.filter(
                specification=OuterRef("pk"), user=user
            )
            can_read |= Exists(on_reader_list)
        return (
            self.filter(current_revision__isnull=False)
            .annotate(can_read=can_read)
            .filter(Q(can_read=True) | Q(access_policy=AccessPolicy.RESTRICTED_LISTED))
        )


class Specification(models.Model):
    slug = models.SlugField(unique=True)
    access_policy = models.CharField(
        max_length=24,
        choices=AccessPolicy.choices,
        default=AccessPolicy.RESTRICTED_CONCEALED,
    )
    # Written for people who cannot read the specification; never derived
    # from the real title or summary.
    safe_listing_title = models.CharField(max_length=200, blank=True)
    safe_listing_summary = models.TextField(blank=True)
    readers = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="readable_specifications"
    )
    current_revision = models.ForeignKey(
        "Revision",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="+",
    )
    archived = models.BooleanField(default=False)
    superseded_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="supersedes",
    )

    objects = SpecificationQuerySet.as_manager()

    def __str__(self):
        return self.slug


class Revision(models.Model):
    specification = models.ForeignKey(
        Specification, on_delete=models.PROTECT, related_name="revisions"
    )
    sequence = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    summary = models.TextField(blank=True)
    body = models.TextField()
    published_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("specification", "sequence"),
                name="specs_revision_unique_sequence",
            )
        ]

    def __str__(self):
        return f"{self.specification} #{self.sequence}"
