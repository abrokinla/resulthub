from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from accounts.permissions import HasPermission, user_has_permission
from classes.models import ClassGroup
from subjects.models import Subject
from students.models import Student, AcademicRecord
from students.serializers import StudentSerializer, AcademicRecordSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_student(request):
    if not user_has_permission(request.user, 'students.manage'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    serializer = StudentSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save(school_id=request.user.school_id)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return Student.objects.none()
        qs = Student.objects.filter(school_id=user.school_id)
        if user.role in ('CLASS_TEACHER', 'SUBJECT_TEACHER'):
            if user.role == 'CLASS_TEACHER':
                class_ids = ClassGroup.objects.filter(
                    teacher_id=user.id, school_id=user.school_id
                ).values_list('id', flat=True)
            else:
                class_ids = Subject.objects.filter(
                    teacher_id=user.id, school_id=user.school_id
                ).values_list('class_group_id', flat=True).distinct()
            qs = qs.filter(class_group_id__in=list(class_ids))
        class_id = self.request.query_params.get('classId')
        if class_id:
            qs = qs.filter(class_group_id=class_id)
        term_id = self.request.query_params.get('termId')
        if term_id:
            qs = qs.filter(results__term_id=term_id)
        return qs.distinct()

    def perform_create(self, serializer):
        serializer.save(school_id=self.request.user.school_id)

    def perform_update(self, serializer):
        if not user_has_permission(self.request.user, 'students.manage'):
            raise PermissionDenied('Permission denied')
        serializer.save()

    def perform_destroy(self, instance):
        if not user_has_permission(self.request.user, 'students.manage'):
            raise PermissionDenied('Permission denied')
        instance.delete()


class AcademicRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AcademicRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return AcademicRecord.objects.none()
        qs = AcademicRecord.objects.filter(student__school_id=user.school_id)
        if user.role in ('CLASS_TEACHER', 'SUBJECT_TEACHER'):
            if user.role == 'CLASS_TEACHER':
                class_ids = ClassGroup.objects.filter(
                    teacher_id=user.id, school_id=user.school_id
                ).values_list('id', flat=True)
            else:
                class_ids = Subject.objects.filter(
                    teacher_id=user.id, school_id=user.school_id
                ).values_list('class_group_id', flat=True).distinct()
            qs = qs.filter(student__class_group_id__in=list(class_ids))
        student_id = self.request.query_params.get('studentId')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        serializer.save()
