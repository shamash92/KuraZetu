from django.db import migrations, models
from django.db.models.functions import Lower, Trim
import django.db.models.deletion


def associate_existing_media(apps, schema_editor):
    Dashboard = apps.get_model("results", "ResultsDashboard")
    MediaHouse = apps.get_model("results", "MediaHouse")
    for dashboard in Dashboard.objects.filter(kind="media").order_by("pk"):
        name = dashboard.name.strip()
        if not name:
            raise RuntimeError(
                "Name existing media dashboards before applying this migration."
            )
        media = (
            MediaHouse.objects.annotate(normalized=Lower(Trim("name")))
            .filter(normalized=name.lower())
            .first()
        )
        if media is not None:
            raise RuntimeError(
                "Duplicate media dashboards exist. Reconcile their viewer assignments before applying this migration."
            )
        media = MediaHouse.objects.create(name=name)
        dashboard.media_house = media
        dashboard.save(update_fields=["media_house"])


def clear_media_links(apps, schema_editor):
    apps.get_model("results", "ResultsDashboard").objects.update(media_house=None)


class Migration(migrations.Migration):
    dependencies = [("results", "0019_sales_onboarding_group")]
    operations = [
        migrations.CreateModel(
            name="MediaHouse",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=160)),
            ],
            options={
                "constraints": [
                    models.UniqueConstraint(
                        Lower(Trim("name")), name="unique_media_house_name"
                    )
                ]
            },
        ),
        migrations.AddField(
            model_name="resultsdashboard",
            name="media_house",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="results.mediahouse",
            ),
        ),
        migrations.RemoveConstraint(
            model_name="resultsdashboard", name="dashboard_target_matches_kind"
        ),
        migrations.RunPython(associate_existing_media, clear_media_links),
        migrations.AddConstraint(
            model_name="resultsdashboard",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(
                        kind="aspirant",
                        aspirant__isnull=False,
                        party__isnull=True,
                        media_house__isnull=True,
                    )
                    | models.Q(
                        kind="party",
                        aspirant__isnull=True,
                        party__isnull=False,
                        media_house__isnull=True,
                    )
                    | models.Q(
                        kind="media",
                        aspirant__isnull=True,
                        party__isnull=True,
                        media_house__isnull=False,
                    )
                ),
                name="dashboard_target_matches_kind",
            ),
        ),
    ]
