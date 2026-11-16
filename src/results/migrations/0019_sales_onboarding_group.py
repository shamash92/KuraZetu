from django.db import migrations


def sales_group(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    Permission = apps.get_model("auth", "Permission")
    Group = apps.get_model("auth", "Group")
    content_type, _ = ContentType.objects.get_or_create(
        app_label="results", model="resultsdashboard"
    )
    permission, _ = Permission.objects.get_or_create(
        content_type=content_type,
        codename="manage_dashboards",
        defaults={"name": "Manage sales dashboard onboarding"},
    )
    group, _ = Group.objects.get_or_create(name="Sales onboarding")
    group.permissions.add(permission)


class Migration(migrations.Migration):
    dependencies = [
        ("results", "0018_resultsdashboard_dashboardmember_and_more"),
        ("accounts", "0008_user_groups"),
    ]
    operations = [migrations.RunPython(sales_group, migrations.RunPython.noop)]
