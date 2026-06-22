import uuid
from django.db import models
from accounts.fields import CharIDField


class Student(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('PROMOTED', 'Promoted'),
        ('GRADUATED', 'Graduated'),
        ('REPEATING', 'Repeating'),
    ]

    id = CharIDField(primary_key=True, default=uuid.uuid4)
    school = models.ForeignKey(
        'schools.School', on_delete=models.CASCADE, related_name='students',
        db_column='schoolId'
    )
    class_group = models.ForeignKey(
        'classes.ClassGroup', on_delete=models.CASCADE, related_name='students',
        db_column='classId'
    )
    first_name = models.TextField(db_column='firstName')
    last_name = models.TextField(db_column='lastName')
    reg_number = models.TextField(db_column='regNumber')
    parent_pin_hash = models.TextField(db_column='parentPinHash')
    status = models.TextField(choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = '"Student"'
        unique_together = [('school', 'reg_number')]

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.reg_number})'


class AcademicRecord(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('PROMOTED', 'Promoted'),
        ('GRADUATED', 'Graduated'),
        ('REPEATING', 'Repeating'),
    ]

    id = CharIDField(primary_key=True, default=uuid.uuid4)
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name='academic_records',
        db_column='studentId'
    )
    class_group = models.ForeignKey(
        'classes.ClassGroup', on_delete=models.CASCADE, related_name='academic_records',
        db_column='classId'
    )
    academic_year = models.TextField(db_column='academicYear')
    annual_cumulative = models.FloatField(null=True, blank=True, db_column='annualCumulative')
    annual_position = models.IntegerField(null=True, blank=True, db_column='annualPosition')
    status = models.TextField(choices=STATUS_CHOICES, default='ACTIVE')
    promoted_at = models.DateTimeField(null=True, blank=True, db_column='promotedAt')
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = '"AcademicRecord"'

    def __str__(self):
        return f'{self.student} - {self.academic_year}'
