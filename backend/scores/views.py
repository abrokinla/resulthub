from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Assessment, ScoreSummary
from .serializers import AssessmentSerializer, ScoreSummarySerializer


class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return Assessment.objects.none()
        qs = Assessment.objects.filter(student__school_id=user.school_id)
        student_subject_id = self.request.query_params.get('studentSubjectId')
        if student_subject_id:
            qs = qs.filter(student_subject_id=student_subject_id)
        student_id = self.request.query_params.get('studentId')
        if student_id:
            qs = qs.filter(student_id=student_id)
        exam_period_id = self.request.query_params.get('examPeriodId')
        if exam_period_id:
            qs = qs.filter(exam_period_id=exam_period_id)
        return qs.select_related('student', 'student_subject__subject', 'exam_period')


class ScoreSummaryViewSet(viewsets.ModelViewSet):
    serializer_class = ScoreSummarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return ScoreSummary.objects.none()
        qs = ScoreSummary.objects.filter(student__school_id=user.school_id)
        student_id = self.request.query_params.get('studentId')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.select_related('student', 'student_subject__subject')
