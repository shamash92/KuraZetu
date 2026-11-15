"""Paid dashboard access is separate from submission and verification roles."""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower, Trim

from phonenumber_field.modelfields import PhoneNumberField


class MediaHouse(models.Model):
    name = models.CharField(max_length=160)

    class Meta:
        constraints = [
            models.UniqueConstraint(Lower(Trim("name")), name="unique_media_house_name")
        ]

    def clean(self):
        self.name = self.name.strip()
        if not self.name:
            raise ValidationError({"name": "Enter a media house name."})

    def __str__(self):
        return self.name


class ResultsDashboard(models.Model):
    class Kind(models.TextChoices):
        ASPIRANT = "aspirant", "Aspirant"
        PARTY = "party", "Political party"
        MEDIA = "media", "Media"

    kind = models.CharField(max_length=12, choices=Kind.choices)
    name = models.CharField(max_length=160)
    aspirant = models.OneToOneField(
        "results.Aspirant", null=True, blank=True, on_delete=models.PROTECT
    )
    party = models.OneToOneField(
        "results.Party", null=True, blank=True, on_delete=models.PROTECT
    )
    media_house = models.OneToOneField(
        MediaHouse, null=True, blank=True, on_delete=models.PROTECT
    )
    active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        permissions = [("manage_dashboards", "Manage sales dashboard onboarding")]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(
                        kind="aspirant",
                        aspirant__isnull=False,
                        party__isnull=True,
                        media_house__isnull=True,
                    )
                    | Q(
                        kind="party",
                        party__isnull=False,
                        aspirant__isnull=True,
                        media_house__isnull=True,
                    )
                    | Q(
                        kind="media",
                        aspirant__isnull=True,
                        party__isnull=True,
                        media_house__isnull=False,
                    )
                ),
                name="dashboard_target_matches_kind",
            )
        ]

    def clean(self):
        expected = {
            self.Kind.ASPIRANT: (True, False, False),
            self.Kind.PARTY: (False, True, False),
            self.Kind.MEDIA: (False, False, True),
        }
        if expected.get(self.kind) != (
            bool(self.aspirant_id),
            bool(self.party_id),
            bool(self.media_house_id),
        ):
            raise ValidationError(
                "Select only the existing record for this dashboard type."
            )

    def __str__(self):
        return self.name


class DashboardMember(models.Model):
    dashboard = models.ForeignKey(
        ResultsDashboard, on_delete=models.CASCADE, related_name="members"
    )
    phone_number = PhoneNumberField(unique=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="dashboard_membership",
    )
    is_owner = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["dashboard"],
                condition=Q(is_owner=True),
                name="one_dashboard_owner",
            )
        ]
