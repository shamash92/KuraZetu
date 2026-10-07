from django.conf import settings
from django.db import models, transaction
from django.db.models import Exists, Max, OuterRef, Q
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver


class AccessPolicy(models.TextChoices):
    PUBLIC = "PUBLIC"
    RESTRICTED_LISTED = "RESTRICTED_LISTED"
    RESTRICTED_CONCEALED = "RESTRICTED_CONCEALED"


def is_author(user):
    """Whether the account holds an explicit author grant.

    No other account flag makes a person an author.
    """
    return (
        user.is_authenticated and AuthorGrant.objects.filter(user_id=user.pk).exists()
    )


class SpecificationQuerySet(models.QuerySet):
    """The access policy. Views must start from ``discoverable_by``."""

    def discoverable_by(self, user):
        """Specifications the person may know exist.

        Each row carries ``can_read``. When it is false the person may see
        the safe listing metadata and nothing else.
        """
        can_read = Q(access_policy=AccessPolicy.PUBLIC)
        if is_author(user):
            can_read = Q(pk__isnull=False)
        elif user.is_authenticated:
            on_reader_list = Specification.readers.through.objects.filter(
                specification=OuterRef("pk"), user=user
            )
            can_read |= Exists(on_reader_list)
        return (
            self.filter(current_revision__isnull=False)
            .annotate(can_read=can_read)
            .filter(Q(can_read=True) | Q(access_policy=AccessPolicy.RESTRICTED_LISTED))
        )


# How much each policy discloses. A move to a larger number cannot be undone
# in practice, so it needs explicit confirmation.
DISCLOSURE = {
    AccessPolicy.RESTRICTED_CONCEALED: 0,
    AccessPolicy.RESTRICTED_LISTED: 1,
    AccessPolicy.PUBLIC: 2,
}


class Stage(models.TextChoices):
    """How far the work a specification describes has come."""

    BRAINDUMP = "BRAINDUMP"
    DRAFT = "DRAFT"
    ACCEPTED = "ACCEPTED"
    LIVE = "LIVE"


class DocumentSet(models.Model):
    """Specifications that describe related work, shown together.

    The title and summary are shown to anyone who can discover one member,
    so they are written for people who can read none of them.
    """

    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    summary = models.TextField(blank=True)
    # False when the members can be read in any order.
    ordered = models.BooleanField(default=True)

    def __str__(self):
        return self.slug

    def members(self):
        """Every member in the order it is shown, concealed ones included."""
        return self.specifications.order_by("position", "slug")

    @transaction.atomic
    def rearrange(self, slugs):
        """Put the named members in the order given.

        A member that is not named keeps its place among the others, so an
        order made from what one page lists does not disturb the rest.
        """
        members = list(self.members().select_for_update())
        named = {member.slug: member for member in members if member.slug in slugs}
        moved = iter(named[slug] for slug in slugs)
        ordered = [next(moved) if m.slug in named else m for m in members]
        for position, member in enumerate(ordered, start=1):
            member.position = position
        Specification.objects.bulk_update(ordered, ["position"])


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
    # The single working copy. Only authors see it; publishing copies it into
    # a revision.
    draft_title = models.CharField(max_length=200, default="")
    draft_summary = models.TextField(blank=True, default="")
    draft_body = models.TextField(blank=True, default="")
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
    document_set = models.ForeignKey(
        DocumentSet,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="specifications",
    )
    # Where it comes in its set. Never sent to readers: they are given the
    # members they can discover in order, so a gap cannot show that a
    # concealed member exists.
    position = models.PositiveSmallIntegerField(default=0)
    stage = models.CharField(max_length=12, choices=Stage.choices, default=Stage.DRAFT)

    objects = SpecificationQuerySet.as_manager()

    def __str__(self):
        return self.slug

    @property
    def has_unpublished_changes(self):
        revision = self.current_revision
        return revision is None or (
            self.draft_title,
            self.draft_summary,
            self.draft_body,
        ) != (revision.title, revision.summary, revision.body)

    @transaction.atomic
    def publish(self, actor):
        """Copy the draft into a new revision and make it current."""
        spec = Specification.objects.select_for_update().get(pk=self.pk)
        latest = spec.revisions.aggregate(latest=Max("sequence"))["latest"] or 0
        revision = Revision.objects.create(
            specification=spec,
            sequence=latest + 1,
            title=spec.draft_title,
            summary=spec.draft_summary,
            body=spec.draft_body,
        )
        self.current_revision = revision
        self.save(update_fields=["current_revision"])
        Record.objects.create(
            action=Record.Action.PUBLISHED,
            specification=self,
            actor=actor,
            detail=str(revision.sequence),
        )
        return revision

    def join(self, document_set):
        """Move to a document set, as its last member, or out of every set."""
        self.document_set = document_set
        self.position = 0
        if document_set is not None:
            last = document_set.specifications.aggregate(last=Max("position"))
            self.position = (last["last"] or 0) + 1

    def widens_disclosure(self, policy):
        return DISCLOSURE[policy] > DISCLOSURE[self.access_policy]


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


class AuthorGrant(models.Model):
    """The explicit grant that makes an account an author."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="specification_author_grant",
    )

    def __str__(self):
        return f"Author grant {self.pk}"

    # Keeps the grant and the record its signal writes in one transaction.
    # Deletion already runs inside one.
    def save(self, *args, **kwargs):
        with transaction.atomic():
            super().save(*args, **kwargs)


class Record(models.Model):
    """What changed who can see a specification, and when.

    Never shown to readers. ``detail`` holds a policy name or a revision
    number, never specification text.
    """

    class Action(models.TextChoices):
        PUBLISHED = "PUBLISHED"
        POLICY_CHANGED = "POLICY_CHANGED"
        READER_ADDED = "READER_ADDED"
        READER_REMOVED = "READER_REMOVED"
        AUTHOR_GRANTED = "AUTHOR_GRANTED"
        AUTHOR_REVOKED = "AUTHOR_REVOKED"

    action = models.CharField(max_length=16, choices=Action.choices)
    at = models.DateTimeField(auto_now_add=True)
    specification = models.ForeignKey(
        Specification, on_delete=models.SET_NULL, blank=True, null=True
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="+",
    )
    subject = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="+",
    )
    detail = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return f"{self.action} {self.at:%Y-%m-%d %H:%M}"


@receiver(post_save, sender=AuthorGrant)
def record_author_granted(sender, instance, created, **kwargs):
    if created:
        Record.objects.create(
            action=Record.Action.AUTHOR_GRANTED, subject_id=instance.user_id
        )


@receiver(post_delete, sender=AuthorGrant)
def record_author_revoked(sender, instance, origin, **kwargs):
    # When the account itself is being deleted there is nothing left to
    # refer to.
    subject_id = instance.user_id if origin is instance else None
    Record.objects.create(action=Record.Action.AUTHOR_REVOKED, subject_id=subject_id)
