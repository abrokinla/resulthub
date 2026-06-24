import json
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from accounts.permissions import HasPermission, user_has_permission
from classes.models import ClassGroup
from subjects.models import Subject
from students.models import Student
from results.models import Result
from results.serializers import ResultSerializer


def _get_visible_class_ids(user):
    if user.role == 'CLASS_TEACHER':
        return list(ClassGroup.objects.filter(
            teacher_id=user.id, school_id=user.school_id
        ).values_list('id', flat=True))
    elif user.role == 'SUBJECT_TEACHER':
        return list(Subject.objects.filter(
            teacher_id=user.id, school_id=user.school_id
        ).values_list('class_group_id', flat=True).distinct())
    return None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_promotion(request):
    if not user_has_permission(request.user, 'promotion.process'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    class_id = request.data.get('classId')
    term_id = request.data.get('termId')
    if not class_id:
        return Response({'error': 'classId required'}, status=status.HTTP_400_BAD_REQUEST)
    students = Student.objects.filter(class_group_id=class_id, school_id=request.user.school_id)
    promoted = 0
    for student in students:
        student.status = 'PROMOTED'
        student.save(update_fields=['status'])
        promoted += 1
    return Response({'promoted': promoted})


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def approve_results_bulk(request):
    if not user_has_permission(request.user, 'results.approve'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    class_id = request.data.get('classId')
    term_id = request.data.get('termId')
    if not class_id or not term_id:
        return Response({'error': 'classId and termId required'}, status=status.HTTP_400_BAD_REQUEST)
    updated = Result.objects.filter(
        student__class_group_id=class_id,
        student__school_id=request.user.school_id,
        term_id=term_id,
    ).update(
        status='APPROVED',
        approved_at=timezone.now(),
        approved_by=request.user,
    )
    return Response({'approved': updated})


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def save_domains(request):
    if not user_has_permission(request.user, 'results.submit') and \
       not user_has_permission(request.user, 'results.approve'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    data = request.data
    student_id = data.get('studentId')
    term_id = data.get('termId')
    if not student_id or not term_id:
        return Response({'error': 'studentId and termId required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        result = Result.objects.get(
            student_id=student_id, term_id=term_id,
            student__school_id=request.user.school_id,
        )
    except Result.DoesNotExist:
        return Response({'error': 'Result not found'}, status=status.HTTP_404_NOT_FOUND)
    result.affective_domain = data.get('affective', result.affective_domain)
    result.psychomotor_data = data.get('psychomotor', result.psychomotor_data)
    result.save(update_fields=['affective_domain', 'psychomotor_data'])
    return Response({'message': 'Domains saved'})


class ResultViewSet(viewsets.ModelViewSet):
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return Result.objects.none()
        qs = Result.objects.filter(student__school_id=user.school_id)
        visible_class_ids = _get_visible_class_ids(user)
        if visible_class_ids is not None:
            qs = qs.filter(student__class_group_id__in=visible_class_ids)
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
    if not user_has_permission(request.user, 'results.approve'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
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

    qs = Result.objects.filter(
        student__class_group_id=class_id,
        student__school_id=user.school_id,
        term_id=term_id,
    )
    visible_class_ids = _get_visible_class_ids(user)
    if visible_class_ids is not None and int(class_id) not in visible_class_ids:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    results = qs.select_related('student', 'term').order_by('student__first_name')
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
