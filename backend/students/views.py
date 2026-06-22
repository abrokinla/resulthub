from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Student, AcademicRecord
from .serializers import StudentSerializer, AcademicRecordSerializer


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return Student.objects.none()
        qs = Student.objects.filter(school_id=user.school_id)
        class_id = self.request.query_params.get('classId')
        if class_id:
            qs = qs.filter(class_group_id=class_id)
        term_id = self.request.query_params.get('termId')
        if term_id:
            qs = qs.filter(results__term_id=term_id)
        return qs.distinct()

    def perform_create(self, serializer):
        serializer.save(school_id=self.request.user.school_id)


class AcademicRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AcademicRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return AcademicRecord.objects.none()
        qs = AcademicRecord.objects.filter(student__school_id=user.school_id)
        student_id = self.request.query_params.get('studentId')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        serializer.save()
