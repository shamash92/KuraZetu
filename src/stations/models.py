from django.contrib.auth import get_user_model
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.text import slugify

User = get_user_model()


class County(gis_models.Model):
    class Meta:
        """Meta definition for County."""

        verbose_name = "County"
        verbose_name_plural = "Counties"

    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    number = models.PositiveIntegerField(unique=True, editable=False)

    boundary = gis_models.PolygonField(blank=True, null=True)
    multi_boundary = gis_models.MultiPolygonField(
        srid=4326, blank=True, null=True
    )  # For Mombasa only

    is_diaspora = models.BooleanField(default=False)
    is_prisons = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Constituency(gis_models.Model):
    class Meta:
        """Meta definition for Constituency."""

        verbose_name = "Constituency"
        verbose_name_plural = "Constituencies"

    name = models.CharField(max_length=255, unique=True)
    county = models.ForeignKey(
        County, on_delete=models.CASCADE, related_name="constituencies"
    )
    boundary = gis_models.PolygonField(blank=True, null=True)
    number = models.PositiveIntegerField(unique=True, editable=False)
    is_diaspora = models.BooleanField(default=False)
    is_prisons = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Ward(gis_models.Model):
    name = models.CharField(max_length=255, unique=True)
    constituency = models.ForeignKey(
        Constituency,
        on_delete=models.CASCADE,
        related_name="wards",
    )
    boundary = gis_models.PolygonField(
        blank=True,
        null=True,
    )
    number = models.PositiveIntegerField(unique=True, editable=False)
    is_diaspora = models.BooleanField(default=False)
    is_prisons = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class PollingCenter(gis_models.Model):
    class Meta:
        """Meta definition for PollingCenter."""

        verbose_name = "Polling Center"
        verbose_name_plural = "Polling Centers"

        unique_together = ("code", "ward", "name")

    code = models.CharField(max_length=8, editable=False)
    name = models.CharField(max_length=255)

    ward = models.ForeignKey(Ward, on_delete=models.CASCADE)

    number_of_streams = models.PositiveIntegerField(default=1)

    pin_location = gis_models.PointField(blank=True, null=True)
    pin_location_error = models.CharField(max_length=255, blank=True, null=True)

    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.name)


class PollingStation(models.Model):
    class Meta:
        """Meta definition for PollingStation."""

        verbose_name = "Polling Station"
        verbose_name_plural = "Polling Stations"
        unique_together = ("polling_center", "code")

    polling_center = models.ForeignKey(
        PollingCenter, on_delete=models.CASCADE, related_name="streams"
    )

    stream_number = models.PositiveIntegerField(blank=True, null=True)

    code = models.CharField(max_length=30, editable=False, unique=True)
    registered_voters = models.PositiveIntegerField()

    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.polling_center} - Stream {self.stream_number}"
