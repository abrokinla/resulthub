import json
import uuid
import logging
from django.db import transaction
from .backends import SHA256AuthBackend
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    from rest_framework.views import exception_handler
    response = exception_handler(exc, context)
    if response is not None:
        if isinstance(exc, AuthenticationFailed):
            response.data['error_type'] = 'invalid_credentials'
            if 'token' in str(exc).lower() or 'expired' in str(exc).lower():
                response.data['error_type'] = 'token_expired'
        elif isinstance(exc, PermissionDenied):
            response.data['error_type'] = 'permission_denied'
        elif isinstance(exc, TokenError):
            response.data['error_type'] = 'token_error'
            if 'expired' in str(exc).lower():
                response.data['error_type'] = 'token_expired'
        elif isinstance(exc, InvalidToken):
            response.data['error_type'] = 'invalid_token'
    return response

from schools.models import School, SchoolConfig, Term
from classes.models import ClassGroup
from .models import User, TeacherProfile
from .permissions import HasPermission, user_has_permission
from .serializers import (
    UserSerializer, CombinedProfileSerializer,
    ChangePasswordSerializer,
)
from .services.teacher_invitation import (
    send_teacher_invitation, resend_teacher_invitation as resend_invite,
    _generate_password,
)


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_teacher(request):
    user = request.user
    if not user_has_permission(user, 'users.manage_teachers'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    data = request.data
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    if not name or not email:
        return Response({'error': 'Name and email are required'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'A user with this email already exists'}, status=status.HTTP_409_CONFLICT)

    password = _generate_password()
    teacher = User(email=email, name=name, role='TEACHER', school_id=user.school_id)
    teacher.set_password(password)
    teacher.save()
    TeacherProfile.objects.create(user=teacher)
    email_sent = send_teacher_invitation(teacher, password)
    data = UserSerializer(teacher).data
    data['emailSent'] = email_sent
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_teacher_invitation(request):
    user = request.user
    if not user_has_permission(user, 'users.manage_teachers'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    teacher_id = request.data.get('teacherId')
    if not teacher_id:
        return Response({'error': 'teacherId is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        teacher = User.objects.get(
            id=teacher_id, school_id=user.school_id,
            role='TEACHER',
        )
    except User.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)
    resend_invite(teacher)
    return Response({'status': 'ok'})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user
    profile, _ = TeacherProfile.objects.get_or_create(user=user)

    if request.method == 'GET':
        return Response(CombinedProfileSerializer(user).data)

    data = request.data
    if 'name' in data:
        user.name = data['name'].strip()
        user.save(update_fields=['name'])
    if 'gender' in data:
        user.gender = data['gender']
        user.save(update_fields=['gender'])
    if 'phone' in data:
        profile.phone = data['phone'].strip()
    if 'address' in data:
        profile.address = data['address'].strip()
    profile.save()
    return Response(CombinedProfileSerializer(user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save(update_fields=['password'])
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    user = request.user
    profile, _ = TeacherProfile.objects.get_or_create(user=user)
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            file, folder='teacher_profiles',
            resource_type='image',
            public_id=str(uuid.uuid4()),
        )
        profile.profile_picture = result['secure_url']
        profile.save(update_fields=['profile_picture'])
        return Response({'url': result['secure_url']})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_credential(request):
    user = request.user
    profile, _ = TeacherProfile.objects.get_or_create(user=user)
    file = request.FILES.get('file')
    name = request.data.get('name', '').strip()
    if not file or not name:
        return Response({'error': 'File and name are required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            file, folder='teacher_credentials',
            resource_type='auto',
            public_id=str(uuid.uuid4()),
        )
        certs = list(profile.certificates) if profile.certificates else []
        certs.append({'name': name, 'url': result['secure_url']})
        profile.certificates = certs
        profile.save(update_fields=['certificates'])
        return Response({'certificates': certs})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    profile_complete = True
    if user.role == 'TEACHER':
        try:
            tp = user.teacher_profile
            profile_complete = bool(tp.phone and tp.profile_picture)
        except TeacherProfile.DoesNotExist:
            profile_complete = False
    return Response({
        'id': str(user.id),
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'schoolId': str(user.school_id) if user.school_id else None,
        'schoolSlug': user.school.slug if user.school else None,
        'profileComplete': profile_complete,
    })


CAN_CREATE_ROLE = {
    'ADMIN': ['PRINCIPAL', 'VICE_PRINCIPAL', 'SECRETARY', 'ACCOUNTANT'],
    'PRINCIPAL': ['VICE_PRINCIPAL', 'SECRETARY'],
    'VICE_PRINCIPAL': ['SECRETARY'],
}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_staff(request):
    user = request.user
    role = request.data.get('role', '').strip()
    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip().lower()

    creatable = CAN_CREATE_ROLE.get(user.role, [])
    if role not in creatable:
        return Response({'error': 'You cannot create this role'}, status=status.HTTP_403_FORBIDDEN)
    if not name or not email:
        return Response({'error': 'Name and email are required'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'A user with this email already exists'}, status=status.HTTP_409_CONFLICT)

    password = _generate_password()
    staff = User(email=email, name=name, role=role, school_id=user.school_id)
    staff.set_password(password)
    staff.save()
    TeacherProfile.objects.create(user=staff)
    email_sent = send_teacher_invitation(staff, password)
    data = UserSerializer(staff).data
    data['emailSent'] = email_sent
    return Response(data, status=status.HTTP_201_CREATED)


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
