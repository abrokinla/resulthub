import uuid
from django.db import models
from accounts.fields import CharIDField


class School(models.Model):
    id = CharIDField(primary_key=True, default=uuid.uuid4)
    name = models.TextField()
    slug = models.TextField(unique=True)
    email = models.TextField()
    logo_url = models.TextField(null=True, blank=True, db_column='logoUrl')
    phone = models.TextField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = '"School"'

    def __str__(self):
        return self.name


class SchoolConfig(models.Model):
    id = CharIDField(primary_key=True, default=uuid.uuid4)
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name='configs',
        db_column='schoolId'
    )
    pass_threshold = models.IntegerField(default=50, db_column='passThreshold')
    distinction_threshold = models.IntegerField(default=75, db_column='distinctionThreshold')
    graduation_type = models.TextField(default='passAll', db_column='graduationType')
    graduation_min_cumulative = models.IntegerField(default=50, db_column='graduationMinCumulative')
    graduation_rules = models.JSONField(default=dict, blank=True, db_column='graduationRules')
    rating_scale = models.JSONField(default=list, db_column='ratingScale')
    affective_traits = models.JSONField(default=list, db_column='affectiveTraits')
    psychomotor_skills = models.JSONField(default=list, db_column='psychomotorSkills')
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = '"SchoolConfig"'

    def __str__(self):
        return f'Config for {self.school.name}'


class Term(models.Model):
    NAME_CHOICES = [
        ('FIRST', 'First'),
        ('SECOND', 'Second'),
        ('THIRD', 'Third'),
    ]

    id = CharIDField(primary_key=True, default=uuid.uuid4)
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name='terms',
        db_column='schoolId'
    )
    name = models.TextField(choices=NAME_CHOICES)
    academic_year = models.TextField(db_column='academicYear')
    is_current = models.BooleanField(default=False, db_column='isCurrent')
    starts_at = models.DateTimeField(null=True, blank=True, db_column='startsAt')
    ends_at = models.DateTimeField(null=True, blank=True, db_column='endsAt')
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = '"Term"'

    def __str__(self):
        return f'{self.get_name_display()} Term {self.academic_year}'


class ExamPeriod(models.Model):
    TYPE_CHOICES = [
        ('MID_TERM', 'Mid Term'),
        ('TERMINAL', 'Terminal'),
    ]

    id = CharIDField(primary_key=True, default=uuid.uuid4)
    term = models.ForeignKey(
        Term, on_delete=models.CASCADE, related_name='exam_periods',
        db_column='termId'
    )
    type = models.TextField(choices=TYPE_CHOICES)
    name = models.TextField()
    is_open = models.BooleanField(default=False, db_column='isOpen')
    starts_at = models.DateTimeField(db_column='startsAt')
    ends_at = models.DateTimeField(db_column='endsAt')
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = '"ExamPeriod"'

    def __str__(self):
        return f'{self.name} ({self.term})'
