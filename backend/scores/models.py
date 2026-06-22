import uuid
from django.db import models
from accounts.fields import CharIDField


class Assessment(models.Model):
    TYPE_CHOICES = [
        ('CLASS_TEST', 'Class Test'),
        ('MID_TERM_EXAM', 'Mid Term Exam'),
        ('TERMINAL_EXAM', 'Terminal Exam'),
    ]

    id = CharIDField(primary_key=True, default=uuid.uuid4)
    student = models.ForeignKey(
        'students.Student', on_delete=models.CASCADE, related_name='assessments',
        db_column='studentId'
    )
    student_subject = models.ForeignKey(
        'subjects.StudentSubject', on_delete=models.CASCADE, related_name='assessments',
        db_column='studentSubjectId'
    )
    exam_period = models.ForeignKey(
        'schools.ExamPeriod', on_delete=models.CASCADE, related_name='assessments',
        db_column='examPeriodId'
    )
    type = models.TextField(choices=TYPE_CHOICES)
    name = models.TextField()
    max_score = models.IntegerField(db_column='maxScore')
    score_obtained = models.IntegerField(db_column='scoreObtained')
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = '"Assessment"'

    def __str__(self):
        return f'{self.type} - {self.score_obtained}/{self.max_score}'


class ScoreSummary(models.Model):
    id = CharIDField(primary_key=True, default=uuid.uuid4)
    student = models.ForeignKey(
        'students.Student', on_delete=models.CASCADE, related_name='score_summaries',
        db_column='studentId'
    )
    student_subject = models.OneToOneField(
        'subjects.StudentSubject', on_delete=models.CASCADE, related_name='score_summary',
        db_column='studentSubjectId'
    )
    ca_score = models.FloatField(null=True, blank=True, db_column='caScore')
    ca1_score = models.FloatField(null=True, blank=True, db_column='ca1Score')
    ca2_score = models.FloatField(null=True, blank=True, db_column='ca2Score')
    exam_score = models.FloatField(null=True, blank=True, db_column='examScore')
    total_score = models.FloatField(null=True, blank=True, db_column='totalScore')
    grade = models.TextField(null=True, blank=True)
    subject_position = models.IntegerField(null=True, blank=True, db_column='subjectPosition')
    subject_teacher_signature = models.TextField(null=True, blank=True, db_column='subjectTeacherSignature')
    is_fail = models.BooleanField(null=True, blank=True, db_column='isFail')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = '"ScoreSummary"'

    def __str__(self):
        return f'Score: {self.total_score} ({self.grade})'
