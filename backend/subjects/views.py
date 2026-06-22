from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Subject, StudentSubject
from .serializers import SubjectSerializer, StudentSubjectSerializer


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
