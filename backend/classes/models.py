import uuid
from django.db import models
from accounts.fields import CharIDField


class ClassGroup(models.Model):
    SECTION_CHOICES = [
        ('NURSERY', 'Nursery'),
        ('PRIMARY', 'Primary'),
        ('JUNIOR_SECONDARY', 'Junior Secondary'),
        ('SENIOR_SECONDARY', 'Senior Secondary'),
    ]
    SHEET_TYPE_CHOICES = [
        ('NURSERY_EARLY', 'Nursery Early'),
        ('PRIMARY', 'Primary'),
        ('JUNIOR_SECONDARY', 'Junior Secondary'),
        ('SENIOR_SECONDARY_EXTENDED', 'Senior Secondary Extended'),
    ]

    id = CharIDField(primary_key=True, default=uuid.uuid4)
    school = models.ForeignKey(
        'schools.School', on_delete=models.CASCADE, related_name='class_groups',
        db_column='schoolId'
    )
    name = models.TextField()
    section = models.TextField(choices=SECTION_CHOICES)
    sheet_type = models.TextField(choices=SHEET_TYPE_CHOICES, default='PRIMARY', db_column='sheetType')
    order = models.IntegerField()
    teacher = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='class_groups', db_column='teacherId'
    )
    academic_year = models.TextField(db_column='academicYear')
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = '"Class"'

    def __str__(self):
        return f'{self.name} ({self.academic_year})'
