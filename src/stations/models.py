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

    radius = models.FloatField(default=0.05, help_text="km")  # 50m
    boundary = gis_models.PolygonField(blank=True, null=True)

    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.name)

    def save(self, *args, **kwargs):
        creating = self._state.adding
        update_boundary = False

        # print(creating, "creating value")
        # print(update_boundary, "update_boundary")

        if not creating:
            # print("not creating, updating ...")
            old = type(self).objects.get(pk=self.pk)
            # Only update if pin_location changed and not if boundary changed directly
            if old.pin_location != self.pin_location:
                update_boundary = True
            if self.pin_location and self.boundary is None:
                update_boundary = True
            if old.boundary != self.boundary:
                if self.boundary is None:
                    pass
                else:
                    self.pin_location = self.boundary.centroid
        else:
            update_boundary = True

        if update_boundary and self.pin_location:
            center = self.pin_location
            radius = self.radius * 0.008  # Convert km to degrees
            circle = center.buffer(radius)
            self.boundary = circle

        if self.boundary and self.pin_location is None:
            self.pin_location = self.boundary.centroid

        super().save(*args, **kwargs)


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
        return f"{self.polling_center} - Stream {self.code}"

    def save(self, *args, **kwargs):
        if not self.stream_number:
            num = self.code[-2:]
            # print(num, "num")
            self.stream_number = int(num)

        super().save(*args, **kwargs)


class PollingCenterVerification(gis_models.Model):
    class Meta:
        """Meta definition for PollingCenterVerification."""

        verbose_name = "Polling Center Verification"
        verbose_name_plural = "Polling Center Verifications"

        # unique_together = ("code", "ward", "name")

    polling_center = models.ForeignKey(
        PollingCenter, on_delete=models.CASCADE, related_name="verifications"
    )

    number_of_streams = models.PositiveIntegerField(default=1)

    pin_location = gis_models.PointField(blank=True, null=True)
    comments = models.CharField(max_length=255, blank=True, null=True)

    radius = models.FloatField(default=0.05, help_text="km")  # 50m
    boundary = gis_models.PolygonField(blank=True, null=True)

    anonymous_verification = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    date_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.polling_center.name)

    def save(self, *args, **kwargs):
        update_boundary = False

        # print(creating, "creating value")
        # print(update_boundary, "update_boundary")

        if self.pin_location:
            center = self.pin_location
            radius = self.radius * 0.008  # Convert km to degrees
            circle = center.buffer(radius)
            self.boundary = circle

        super().save(*args, **kwargs)
