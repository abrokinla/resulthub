from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from students.models import Student
from .models import Result
from .serializers import ResultSerializer


class ResultViewSet(viewsets.ModelViewSet):
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return Result.objects.none()
        qs = Result.objects.filter(student__school_id=user.school_id)
        student_id = self.request.query_params.get('studentId')
        if student_id:
            qs = qs.filter(student_id=student_id)
        class_id = self.request.query_params.get('classId')
        if class_id:
            qs = qs.filter(student__class_group_id=class_id)
        term_id = self.request.query_params.get('termId')
        if term_id:
            qs = qs.filter(term_id=term_id)
        return qs.select_related('student', 'term', 'approved_by')

    def perform_create(self, serializer):
        serializer.save()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_result(request, pk):
    try:
        result = Result.objects.get(pk=pk, student__school_id=request.user.school_id)
    except Result.DoesNotExist:
        return Response({'error': 'Result not found'}, status=status.HTTP_404_NOT_FOUND)
    result.status = 'APPROVED'
    result.approved_at = timezone.now()
    result.approved_by = request.user
    result.save()
    return Response({'message': 'Result approved successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_computed_results(request, class_id, term_id):
    user = request.user
    if not user.school_id:
        return Response({'error': 'No school associated'}, status=status.HTTP_400_BAD_REQUEST)

    results = Result.objects.filter(
        student__class_group_id=class_id,
        student__school_id=user.school_id,
        term_id=term_id,
    ).select_related('student', 'term').order_by('student__first_name')

    serializer = ResultSerializer(results, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_access(request, reg_number, pin):
    try:
        student = Student.objects.select_related('class_group', 'school').get(reg_number=reg_number)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

    if student.parent_pin_hash != pin:
        return Response({'error': 'Invalid PIN'}, status=status.HTTP_403_FORBIDDEN)

    result = Result.objects.filter(
        student=student, status='APPROVED'
    ).select_related('term').order_by('-created_at').first()

    if not result:
        return Response({
            'student': None,
            'result': None,
            'scores': [],
        })

    from subjects.models import StudentSubject
    from scores.models import ScoreSummary

    score_rows = ScoreSummary.objects.filter(
        student=student, total_score__isnull=False
    ).select_related('student_subject__subject')

    scores = [
        {
            'subject': s.student_subject.subject.name,
            'caScore': s.ca_score,
            'examScore': s.exam_score,
            'totalScore': s.total_score,
            'grade': s.grade,
            'subjectPosition': s.subject_position,
            'isFail': s.is_fail,
        }
        for s in score_rows
    ]

    return Response({
        'student': {
            'firstName': student.first_name,
            'lastName': student.last_name,
            'regNumber': student.reg_number,
            'className': student.class_group.name,
            'sheetType': student.class_group.sheet_type,
            'schoolName': student.school.name,
            'schoolAddress': student.school.address,
            'schoolLogoUrl': student.school.logo_url,
        },
        'result': {
            'termName': result.term.name,
            'academicYear': result.academic_year,
            'cumulative': result.cumulative,
            'average': result.average,
            'position': result.position,
            'positionOutOf': result.position_out_of,
            'teacherComment': result.teacher_comment,
            'adminComment': result.admin_comment,
            'adminGrade': result.admin_grade,
            'affectiveDomain': result.affective_domain,
            'psychomotorData': result.psychomotor_data,
            'daysPresent': result.days_present,
            'daysAbsent': result.days_absent,
            'outstandingFees': result.outstanding_fees,
            'resumptionDate': result.resumption_date,
            'createdAt': result.created_at.isoformat(),
        },
        'scores': scores,
    })
