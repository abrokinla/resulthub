import uuid
from django.db import models
from accounts.fields import CharIDField


class Subject(models.Model):
    id = CharIDField(primary_key=True, default=uuid.uuid4)
    school = models.ForeignKey(
        'schools.School', on_delete=models.CASCADE, related_name='subjects',
        db_column='schoolId'
    )
    class_group = models.ForeignKey(
        'classes.ClassGroup', on_delete=models.CASCADE, related_name='subjects',
        db_column='classId'
    )
    name = models.TextField()
    code = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')

    class Meta:
        db_table = '"Subject"'

    def __str__(self):
        return f'{self.name} ({self.code or "no code"})'


class StudentSubject(models.Model):
    id = CharIDField(primary_key=True, default=uuid.uuid4)
    student = models.ForeignKey(
        'students.Student', on_delete=models.CASCADE, related_name='subject_assignments',
        db_column='studentId'
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name='student_assignments',
        db_column='subjectId'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')

    class Meta:
        db_table = '"StudentSubject"'
        unique_together = [('student', 'subject')]

    def __str__(self):
        return f'{self.student.reg_number} - {self.subject.name}'
