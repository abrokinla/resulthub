from datetime import date
import cloudinary.uploader
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from accounts.permissions import HasPermission, user_has_permission
from schools.models import School, SchoolConfig, Term, ExamPeriod, Holiday
from schools.serializers import (
    SchoolListSerializer, SchoolConfigSerializer,
    TermSerializer, ExamPeriodSerializer, HolidaySerializer,
)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_school(request, slug):
    user = request.user
    try:
        school = School.objects.get(slug=slug)
    except School.DoesNotExist:
        return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        serializer = SchoolListSerializer(school)
        return Response(serializer.data)
    if not user_has_permission(user, 'settings.manage'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    serializer = SchoolListSerializer(school, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_logo(request):
    if not user_has_permission(request.user, 'settings.manage'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    file = request.FILES.get('image')
    if not file:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
    allowed = ['image/jpeg', 'image/png', 'image/webp']
    if file.content_type not in allowed:
        return Response({'error': 'Invalid format. Use JPEG, PNG, or WebP'}, status=status.HTTP_400_BAD_REQUEST)
    if file.size > 5 * 1024 * 1024:
        return Response({'error': 'File too large (max 5MB)'}, status=status.HTTP_400_BAD_REQUEST)
    result = cloudinary.uploader.upload(
        file, folder='resulthub/logos',
        transformation=[{'width': 400, 'height': 400, 'crop': 'limit', 'quality': 'auto:good', 'fetch_format': 'auto'}],
    )
    School.objects.filter(id=request.user.school_id).update(logo_url=result['secure_url'])
    return Response({'url': result['secure_url']})


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def school_config(request):
    user = request.user
    if not user.school_id:
        return Response({'error': 'User not associated with a school'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        config = SchoolConfig.objects.get(school_id=user.school_id)
    except SchoolConfig.DoesNotExist:
        return Response({'error': 'Config not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(SchoolConfigSerializer(config).data)
    if not user_has_permission(user, 'settings.manage'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    serializer = SchoolConfigSerializer(config, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


class TermViewSet(viewsets.ModelViewSet):
    serializer_class = TermSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.school_id:
            return Term.objects.filter(school_id=user.school_id)
        return Term.objects.none()

    def perform_create(self, serializer):
        if not user_has_permission(self.request.user, 'terms.manage'):
            raise PermissionDenied('Permission denied')
        serializer.save(school_id=self.request.user.school_id)

    def perform_update(self, serializer):
        if not user_has_permission(self.request.user, 'terms.manage'):
            raise PermissionDenied('Permission denied')
        serializer.save()

    def perform_destroy(self, instance):
        if not user_has_permission(self.request.user, 'terms.manage'):
            raise PermissionDenied('Permission denied')
        instance.delete()

    @action(detail=True, methods=['post'])
    def set_current(self, request, pk=None):
        if not user_has_permission(request.user, 'terms.manage'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        term = self.get_object()
        Term.objects.filter(school_id=request.user.school_id).update(is_current=False)
        term.is_current = True
        term.save(update_fields=['is_current'])
        return Response({'status': 'ok'})

    @action(detail=False, methods=['post'])
    def advance(self, request):
        if not user_has_permission(request.user, 'terms.manage'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        school_id = request.user.school_id
        current = Term.objects.filter(school_id=school_id, is_current=True).first()
        if current:
            current.is_current = False
            current.save(update_fields=['is_current'])

        order = ['FIRST', 'SECOND', 'THIRD']
        next_name = 'FIRST'
        academic_year = str(date.today().year)
        if current:
            idx = order.index(current.name) if current.name in order else -1
            if 0 <= idx < 2:
                next_name = order[idx + 1]
            else:
                next_name = 'FIRST'
                year_parts = current.academic_year.split('/')
                start = int(year_parts[0]) + 1
                academic_year = f'{start}/{start + 1}'

        term, created = Term.objects.get_or_create(
            school_id=school_id, name=next_name, academic_year=academic_year,
            defaults={'is_current': True, 'starts_at': None, 'ends_at': None},
        )
        if not created:
            term.is_current = True
            term.starts_at = None
            term.ends_at = None
            term.save(update_fields=['is_current', 'starts_at', 'ends_at'])
        return Response(TermSerializer(term).data)


class ExamPeriodViewSet(viewsets.ModelViewSet):
    serializer_class = ExamPeriodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.school_id:
            return ExamPeriod.objects.filter(term__school_id=user.school_id)
        return ExamPeriod.objects.none()

    def perform_create(self, serializer):
        if not user_has_permission(self.request.user, 'terms.manage'):
            raise PermissionDenied('Permission denied')
        serializer.save()

    def perform_update(self, serializer):
        if not user_has_permission(self.request.user, 'terms.manage'):
            raise PermissionDenied('Permission denied')
        serializer.save()

    def perform_destroy(self, instance):
        if not user_has_permission(self.request.user, 'terms.manage'):
            raise PermissionDenied('Permission denied')
        instance.delete()

    @action(detail=True, methods=['post'])
    def open(self, request, pk=None):
        if not user_has_permission(request.user, 'terms.manage'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        period = self.get_object()
        period.is_open = True
        period.save(update_fields=['is_open'])
        return Response({'status': 'ok'})

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        if not user_has_permission(request.user, 'terms.manage'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        period = self.get_object()
        period.is_open = False
        period.save(update_fields=['is_open'])
        return Response({'status': 'ok'})


class HolidayViewSet(viewsets.ModelViewSet):
    serializer_class = HolidaySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.school_id:
            return Holiday.objects.filter(term__school_id=user.school_id)
        return Holiday.objects.none()

    def perform_create(self, serializer):
        if not user_has_permission(self.request.user, 'terms.manage'):
            raise PermissionDenied('Permission denied')
        serializer.save()

    def perform_update(self, serializer):
        if not user_has_permission(self.request.user, 'terms.manage'):
            raise PermissionDenied('Permission denied')
        serializer.save()

    def perform_destroy(self, instance):
        if not user_has_permission(self.request.user, 'terms.manage'):
            raise PermissionDenied('Permission denied')
        instance.delete()



