import uuid
import hashlib
import secrets
import bcrypt
from django.db import models
from .fields import CharIDField


class User(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('TEACHER', 'Teacher'),
    ]

    id = CharIDField(primary_key=True, default=uuid.uuid4)
    school = models.ForeignKey(
        'schools.School', on_delete=models.CASCADE, related_name='users',
        null=True, blank=True, db_column='schoolId'
    )
    email = models.EmailField(unique=True)
    password = models.TextField(db_column='passwordHash', blank=True)
    name = models.TextField()
    role = models.TextField(choices=ROLE_CHOICES, default='TEACHER')
    phone = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'role']

    class Meta:
        db_table = '"User"'

    def __str__(self):
        return f'{self.name} ({self.email})'

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def check_password(self, raw_password):
        if self.password.startswith('$2'):
            try:
                return bcrypt.checkpw(raw_password.encode(), self.password.encode())
            except Exception:
                return False
        try:
            salt, hash_value = self.password.split('$', 1)
            expected = hashlib.sha256((salt + raw_password).encode()).hexdigest()
            return expected == hash_value
        except (ValueError, IndexError):
            return False

    def set_password(self, raw_password):
        salt = secrets.token_hex(16)
        hash_value = hashlib.sha256((salt + raw_password).encode()).hexdigest()
        self.password = f'{salt}${hash_value}'

    @classmethod
    def get_by_natural_key(cls, email):
        return cls.objects.get(email=email)
