import json
import uuid
from django.db import transaction
from .backends import SHA256AuthBackend
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from schools.models import School, SchoolConfig, Term
from classes.models import ClassGroup
from .models import User
from .serializers import UserSerializer


DEFAULT_CLASSES = [
    {'name': 'Pre-Nursery', 'section': 'NURSERY', 'sheet_type': 'NURSERY_EARLY', 'order': 1},
    {'name': 'Nursery 1', 'section': 'NURSERY', 'sheet_type': 'NURSERY_EARLY', 'order': 2},
    {'name': 'Nursery 2', 'section': 'NURSERY', 'sheet_type': 'NURSERY_EARLY', 'order': 3},
    {'name': 'Primary 1', 'section': 'PRIMARY', 'sheet_type': 'PRIMARY', 'order': 4},
    {'name': 'Primary 2', 'section': 'PRIMARY', 'sheet_type': 'PRIMARY', 'order': 5},
    {'name': 'Primary 3', 'section': 'PRIMARY', 'sheet_type': 'PRIMARY', 'order': 6},
    {'name': 'Primary 4', 'section': 'PRIMARY', 'sheet_type': 'PRIMARY', 'order': 7},
    {'name': 'Primary 5', 'section': 'PRIMARY', 'sheet_type': 'PRIMARY', 'order': 8},
    {'name': 'JSS 1', 'section': 'JUNIOR_SECONDARY', 'sheet_type': 'JUNIOR_SECONDARY', 'order': 9},
    {'name': 'JSS 2', 'section': 'JUNIOR_SECONDARY', 'sheet_type': 'JUNIOR_SECONDARY', 'order': 10},
    {'name': 'JSS 3', 'section': 'JUNIOR_SECONDARY', 'sheet_type': 'JUNIOR_SECONDARY', 'order': 11},
    {'name': 'SSS 1', 'section': 'SENIOR_SECONDARY', 'sheet_type': 'SENIOR_SECONDARY_EXTENDED', 'order': 12},
    {'name': 'SSS 2', 'section': 'SENIOR_SECONDARY', 'sheet_type': 'SENIOR_SECONDARY_EXTENDED', 'order': 13},
    {'name': 'SSS 3', 'section': 'SENIOR_SECONDARY', 'sheet_type': 'SENIOR_SECONDARY_EXTENDED', 'order': 14},
]

DEFAULT_RATING_SCALE = [
    {"grade": "A", "min": 75, "max": 100, "remark": "Excellent"},
    {"grade": "B", "min": 65, "max": 74, "remark": "Very Good"},
    {"grade": "C", "min": 55, "max": 64, "remark": "Good"},
    {"grade": "D", "min": 45, "max": 54, "remark": "Fair"},
    {"grade": "E", "min": 40, "max": 44, "remark": "Poor"},
    {"grade": "F", "min": 0, "max": 39, "remark": "Fail"},
]

DEFAULT_AFFECTIVE_TRAITS = [
    "Punctuality", "Attendance", "Politeness", "Neatness",
    "Self-control", "Honesty", "Leadership", "Teamwork",
]

DEFAULT_PSYCHOMOTOR_SKILLS = [
    "Handwriting", "Drawing", "Painting", "Fluency",
    "Sports", "Music", "Drama", "Craft",
]


@api_view(['POST'])
@permission_classes([AllowAny])
def register_school(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    school_name = data.get('schoolName', name)
    school_address = data.get('schoolAddress', '')

    if not all([name, email, password]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'A user with this email already exists'}, status=status.HTTP_409_CONFLICT)

    slug = school_name.lower().replace(' ', '-')[:50]

    with transaction.atomic():
        school = School.objects.create(
            name=school_name,
            slug=slug,
            email=email,
            address=school_address,
        )

        SchoolConfig.objects.create(
            school=school,
            rating_scale=DEFAULT_RATING_SCALE,
            affective_traits=DEFAULT_AFFECTIVE_TRAITS,
            psychomotor_skills=DEFAULT_PSYCHOMOTOR_SKILLS,
            graduation_rules={
                "NURSERY": {"type": "passAll", "min_cumulative": 50},
                "PRIMARY": {"type": "passAll", "min_cumulative": 50},
                "JUNIOR_SECONDARY": {"type": "custom", "required_subjects": [], "min_additional": 0},
                "SENIOR_SECONDARY": {"type": "custom", "required_subjects": [], "min_additional": 0},
            },
        )

        user = User(
            email=email,
            name=name,
            role='ADMIN',
            school=school,
        )
        user.set_password(password)
        user.save()

        for cls_data in DEFAULT_CLASSES:
            ClassGroup.objects.create(
                school=school,
                name=cls_data['name'],
                section=cls_data['section'],
                sheet_type=cls_data['sheet_type'],
                order=cls_data['order'],
                academic_year='2026',
            )

        Term.objects.create(
            school=school,
            name='FIRST',
            academic_year='2026',
            is_current=True,
        )

    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'School registered successfully',
        'schoolId': str(school.id),
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = SHA256AuthBackend().authenticate(request, username=email, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': str(user.id),
            'email': user.email,
            'name': user.name,
            'role': user.role,
            'schoolId': str(user.school_id) if user.school_id else None,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        'id': str(user.id),
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'schoolId': str(user.school_id) if user.school_id else None,
        'schoolSlug': user.school.slug if user.school else None,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    user = request.user
    if not user.school_id:
        return Response({'error': 'No school associated'}, status=400)
    qs = User.objects.filter(school_id=user.school_id)
    role = request.query_params.get('role')
    if role:
        qs = qs.filter(role=role)
    serializer = UserSerializer(qs, many=True)
    return Response(serializer.data)
