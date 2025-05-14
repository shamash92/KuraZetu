from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from stations.models import Constituency, County, PollingStation, Ward

User = get_user_model()


def party_logo_upload_fn(instance, filename):
    extension = filename.split(".")[-1]
    return f"party/logos/{instance.short_name}.{extension}"


class Party(models.Model):
    class Meta:
        verbose_name = "Party"
        verbose_name_plural = "Parties"

    name = models.CharField(max_length=140, unique=True)
    short_name = models.CharField(
        max_length=6, unique=True
    )  # e.g. PLP, ODM, SAFNA,JUBLE
    logo = models.FileField(
        upload_to=party_logo_upload_fn, max_length=300, blank=True, null=True
    )
    party_colour_hex = models.CharField(
        max_length=7,
        default="#000000",
        help_text=_("Hex colour code for the party. e.g. #000000"),
    )
    is_verified = models.BooleanField(default=False)

    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Call clean to validate before saving
        if self.short_name:
            self.short_name = self.short_name.upper()

        super().save(*args, **kwargs)


def aspirant_pic_upload_fn(instance, filename):
    extension = filename.split(".")[-1]
    return f"party/aspirants/{instance.first_name}.{extension}"


# TODO: add a running mate model and foreignkey it to this model. Perhaps extend this model to a new one
class Aspirant(models.Model):
    class Meta:
        verbose_name = "Aspirant"
        verbose_name_plural = "Aspirants"

    LEVEL_CHOICES = [
        ("president", _("President")),
        ("governor", _("Governor")),
        ("senator", _("Senator")),
        ("mp", _("Member of Parliament")),
        ("women_rep", _("Women Representative")),
        ("mca", _("Member of County Assembly")),
    ]

    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    surname = models.CharField(max_length=120, blank=True, null=True)

    party = models.ForeignKey(Party, on_delete=models.CASCADE)

    level = models.CharField(max_length=40, choices=LEVEL_CHOICES)

    passport_photo = models.FileField(
        upload_to=aspirant_pic_upload_fn, blank=True, null=True
    )
    county = models.ForeignKey(County, on_delete=models.SET_NULL, null=True, blank=True)
    constituency = models.ForeignKey(
        Constituency, on_delete=models.SET_NULL, null=True, blank=True
    )
    ward = models.ForeignKey(Ward, on_delete=models.SET_NULL, null=True, blank=True)
    registered_by = models.CharField(max_length=255, blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    verified_by_party = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    def clean(self):
        # Ensure the correct administrative boundary is selected based on the level
        if self.level == "president" and (
            self.county or self.constituency or self.ward
        ):
            raise ValidationError(
                _(
                    "President should not be associated with any county, constituency, or ward."
                )
            )
        if self.level == "governor" and (
            self.constituency or self.ward or not self.county
        ):
            raise ValidationError(
                _(
                    "Governor must be associated with a county but not a constituency or ward."
                )
            )
        if self.level == "senator" and (
            self.constituency or self.ward or not self.county
        ):
            raise ValidationError(
                _(
                    "Senator must be associated with a county but not a constituency or ward."
                )
            )
        if self.level == "mp" and (self.ward or self.county or not self.constituency):
            raise ValidationError(
                _(
                    "Member of Parliament must be associated with a constituency but not a county only or ward."
                )
            )
        if self.level == "women_rep" and (
            self.constituency or self.ward or not self.county
        ):
            raise ValidationError(
                _(
                    "Women Representative must be associated with a county only but not a constituency or ward."
                )
            )
        if self.level == "mca" and (self.constituency or self.county or not self.ward):
            raise ValidationError(
                _("Member of County Assembly must be associated with a ward only.")
            )

        # TODO: Add validation to make sure aspirants from same party are not running for the same position in the same county/constituency/ward

    def save(self, *args, **kwargs):
        # Call clean to validate before saving
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.level} - {self.party.name}"


# Results


class PollingStationPresidentialResults(models.Model):
    class Meta:
        verbose_name = "Polling Station Presidential Results"
        verbose_name_plural = "Polling Station Presidential Results"
        unique_together = ("polling_station", "presidential_candidate")

    polling_station = models.ForeignKey(
        PollingStation,
        on_delete=models.CASCADE,
        related_name="presidential_polling_station",
    )
    presidential_candidate = models.ForeignKey(
        Aspirant, on_delete=models.CASCADE, related_name="presidential_candidate"
    )
    votes = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)

    def clean(self):
        if self.presidential_candidate.level != "president":
            raise ValidationError(_("Candidate is not running for president."))

    def save(self, *args, **kwargs):
        # Call clean to validate before saving
        self.clean()
        super().save(*args, **kwargs)


class PollingStationGovernorResults(models.Model):
    class Meta:
        unique_together = ("polling_station", "governor_candidate")
        verbose_name = "Polling Station Governor Results"
        verbose_name_plural = "Polling Station Governor Results"

    polling_station = models.ForeignKey(
        PollingStation,
        on_delete=models.CASCADE,
        related_name="governor_polling_station",
    )
    governor_candidate = models.ForeignKey(
        Aspirant, on_delete=models.CASCADE, related_name="governor_candidate"
    )
    votes = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.polling_station} - {self.governor_candidate} - {self.votes}"

    def clean(self):
        if self.governor_candidate.level != "governor":
            raise ValidationError(_("Candidate is not running for governor."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class PollingStationSenatorResults(models.Model):
    class Meta:
        unique_together = ("polling_station", "senator_candidate")
        verbose_name = "Polling Station Senator Results"
        verbose_name_plural = "Polling Station Senator Results"

    polling_station = models.ForeignKey(
        PollingStation, on_delete=models.CASCADE, related_name="senator_polling_station"
    )
    senator_candidate = models.ForeignKey(
        Aspirant, on_delete=models.CASCADE, related_name="senator_candidate"
    )
    votes = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.polling_station} - {self.senator_candidate} - {self.votes}"

    def clean(self):
        if self.senator_candidate.level != "senator":
            raise ValidationError(_("Candidate is not running for senator."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class PollingStationWomenRepResults(models.Model):
    class Meta:
        unique_together = ("polling_station", "woman_rep_candidate")
        verbose_name = "Polling Station  Women Rep Results"
        verbose_name_plural = "Polling Station Women Rep Results"

    polling_station = models.ForeignKey(
        PollingStation,
        on_delete=models.CASCADE,
        related_name="woman_rep_polling_station",
    )
    woman_rep_candidate = models.ForeignKey(
        Aspirant, on_delete=models.CASCADE, related_name="woman_rep_candidate"
    )
    votes = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.polling_station} - {self.woman_rep_candidate} - {self.votes}"

    def clean(self):
        if self.woman_rep_candidate.level != "senator":
            raise ValidationError(_("Candidate is not running for senator."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class PollingStationMpResults(models.Model):
    class Meta:
        unique_together = ("polling_station", "mp_candidate")
        verbose_name = "Polling Station MP Results"
        verbose_name_plural = "Polling Station MP Results"

    polling_station = models.ForeignKey(
        PollingStation, on_delete=models.CASCADE, related_name="mp_polling_station"
    )
    mp_candidate = models.ForeignKey(
        Aspirant, on_delete=models.CASCADE, related_name="mp_candidate"
    )
    votes = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.polling_station} - {self.mp_candidate} - {self.votes}"

    def clean(self):
        if self.mp_candidate.level != "mp":
            raise ValidationError(_("Candidate is not running for MP."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class PollingStationMCAResults(models.Model):
    class Meta:
        unique_together = ("polling_station", "mca_candidate")
        verbose_name = "Polling Station MCA Results"
        verbose_name_plural = "Polling Station MCA Results"

    polling_station = models.ForeignKey(
        PollingStation, on_delete=models.CASCADE, related_name="mca_polling_station"
    )
    mca_candidate = models.ForeignKey(
        Aspirant, on_delete=models.CASCADE, related_name="mca_candidate"
    )
    votes = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.polling_station} - {self.mca_candidate} - {self.votes}"

    def clean(self):
        if self.mca_candidate.level != "mca":
            raise ValidationError(_("Candidate is not running for MCA."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
