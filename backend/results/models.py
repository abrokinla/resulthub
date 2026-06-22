import uuid
from django.db import models
from accounts.fields import CharIDField


class Result(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING_APPROVAL', 'Pending Approval'),
        ('APPROVED', 'Approved'),
    ]
    ADMIN_GRADE_CHOICES = [
        ('PASS', 'Pass'),
        ('FAIL', 'Fail'),
        ('DISTINCTION', 'Distinction'),
    ]

    id = CharIDField(primary_key=True, default=uuid.uuid4)
    student = models.ForeignKey(
        'students.Student', on_delete=models.CASCADE, related_name='results',
        db_column='studentId'
    )
    term = models.ForeignKey(
        'schools.Term', on_delete=models.CASCADE, related_name='results',
        db_column='termId'
    )
    academic_year = models.TextField(db_column='academicYear')
    cumulative = models.FloatField(null=True, blank=True)
    average = models.FloatField(null=True, blank=True)
    position = models.IntegerField(null=True, blank=True)
    position_out_of = models.IntegerField(null=True, blank=True, db_column='positionOutOf')
    days_present = models.IntegerField(null=True, blank=True, db_column='daysPresent')
    days_absent = models.IntegerField(null=True, blank=True, db_column='daysAbsent')
    outstanding_fees = models.TextField(null=True, blank=True, db_column='outstandingFees')
    resumption_date = models.TextField(null=True, blank=True, db_column='resumptionDate')
    teacher_comment = models.TextField(null=True, blank=True, db_column='teacherComment')
    admin_comment = models.TextField(null=True, blank=True, db_column='adminComment')
    admin_grade = models.TextField(null=True, blank=True, choices=ADMIN_GRADE_CHOICES, db_column='adminGrade')
    affective_domain = models.JSONField(null=True, blank=True, db_column='affectiveDomain')
    psychomotor_data = models.JSONField(null=True, blank=True, db_column='psychomotorData')
    status = models.TextField(choices=STATUS_CHOICES, default='DRAFT')
    approved_at = models.DateTimeField(null=True, blank=True, db_column='approvedAt')
    approved_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_results', db_column='approvedById'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = '"Result"'

    def __str__(self):
        return f'Result for {self.student} - {self.term}'
