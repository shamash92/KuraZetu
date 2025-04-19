import uuid

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

    def __str__(self):
        return self.name
