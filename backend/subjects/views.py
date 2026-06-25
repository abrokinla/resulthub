from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import HasPermission, user_has_permission, SECTION_GROUP_MAP
from accounts.models import User
from subjects.models import Subject, StudentSubject
from subjects.serializers import SubjectSerializer, StudentSubjectSerializer
from students.models import Student


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subject(request):
    if not user_has_permission(request.user, 'subjects.manage'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    class_ids = request.data.get('classIds')
    if isinstance(class_ids, str):
        class_ids = [class_ids]

    raw = {}
    for k, v in request.data.items():
        if k in ('classIds',):
            continue
        if isinstance(v, list):
            raw[k] = v[-1]
        else:
            raw[k] = v
    raw.pop('classId', None)
    raw.pop('schoolId', None)
    if raw.get('teacherId'):
        raw['teacher'] = raw.pop('teacherId')
    raw['school_id'] = request.user.school_id

    created = []
    for class_id in class_ids:
        serializer = SubjectSerializer(data={**raw, 'class_group': class_id})
        serializer.is_valid(raise_exception=True)
        serializer.save(school_id=request.user.school_id)
        created.append(serializer.data)
    return Response(created, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_all_subjects(request):
    if not user_has_permission(request.user, 'subjects.manage'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    class_id = request.data.get('classId')
    subject_ids = request.data.get('subjectIds', [])
    if not class_id or not subject_ids:
        return Response({'error': 'classId and subjectIds required'}, status=status.HTTP_400_BAD_REQUEST)
    students = Student.objects.filter(class_group_id=class_id, school_id=request.user.school_id)
    created = 0
    for student in students:
        for subject_id in subject_ids:
            _, was_created = StudentSubject.objects.get_or_create(
                student=student, subject_id=subject_id,
            )
            if was_created:
                created += 1
    return Response({'created': created})


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return Subject.objects.none()
        qs = Subject.objects.filter(school_id=user.school_id)
        section_group = self.request.query_params.get('section_group')
        if section_group in SECTION_GROUP_MAP:
            qs = qs.filter(class_group__section__in=SECTION_GROUP_MAP[section_group])
        class_id = self.request.query_params.get('classId')
        if class_id:
            qs = qs.filter(class_group_id=class_id)
        if user.role == 'TEACHER':
            qs = qs.filter(teacher_id=user.id)
        return qs

    def perform_create(self, serializer):
        serializer.save(school_id=self.request.user.school_id)


class StudentSubjectViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSubjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return StudentSubject.objects.none()
        qs = StudentSubject.objects.filter(student__school_id=user.school_id)
        student_id = self.request.query_params.get('studentId')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.select_related('subject', 'student')
