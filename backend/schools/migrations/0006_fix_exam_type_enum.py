from django.db import migrations


def add_enum_values(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(
                "ALTER TYPE \"AssessmentType\" ADD VALUE IF NOT EXISTS 'MID_TERM'"
            )
            cursor.execute(
                "ALTER TYPE \"AssessmentType\" ADD VALUE IF NOT EXISTS 'TERMINAL'"
            )


class Migration(migrations.Migration):

    dependencies = [
        ('schools', '0005_alter_examperiod_ends_at_alter_examperiod_starts_at_and_more'),
    ]

    operations = [
        migrations.RunPython(add_enum_values, migrations.RunPython.noop),
    ]
