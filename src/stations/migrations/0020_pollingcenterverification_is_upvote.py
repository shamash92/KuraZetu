from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("stations", "0019_pollingcenterverification_is_outlier"),
    ]

    operations = [
        migrations.AddField(
            model_name="pollingcenterverification",
            name="is_upvote",
            field=models.BooleanField(default=False),
        ),
    ]
