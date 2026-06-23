from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Subject, StudentSubject
from .serializers import SubjectSerializer, StudentSubjectSerializer
from students.models import Student


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subject(request):
    data = request.data
    data = data.copy() if hasattr(data, 'copy') else data
    serializer = SubjectSerializer(data={**data, 'school_id': request.user.school_id})
    serializer.is_valid(raise_exception=True)
    serializer.save(school_id=request.user.school_id)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_all_subjects(request):
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
        class_id = self.request.query_params.get('classId')
        if class_id:
            qs = qs.filter(class_group_id=class_id)
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
