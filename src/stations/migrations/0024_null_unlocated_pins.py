from django.contrib.gis.geos import Point
from django.db import migrations


def null_unlocated_pins(apps, schema_editor):
    """A (0, 0) pin means the centre has no known location; store it as null.

    The radius circle drawn around (0, 0) goes too. Both are cleared in one
    update, because PollingCenter.save() would refill a null pin from the
    circle's centroid.
    """
    PollingCenter = apps.get_model("stations", "PollingCenter")
    PollingCenter.objects.filter(pin_location__equals=Point(0, 0, srid=4326)).update(
        pin_location=None, boundary=None
    )


class Migration(migrations.Migration):

    dependencies = [
        ("stations", "0023_centre_radius_100m"),
    ]

    operations = [
        migrations.RunPython(null_unlocated_pins, migrations.RunPython.noop),
    ]
