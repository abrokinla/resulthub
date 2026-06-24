from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import HasPermission, user_has_permission
from classes.models import ClassGroup
from classes.serializers import ClassGroupSerializer
from subjects.models import Subject


class ClassGroupViewSet(viewsets.ModelViewSet):
    serializer_class = ClassGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return ClassGroup.objects.none()
        qs = ClassGroup.objects.filter(school_id=user.school_id)
        if user.role == 'CLASS_TEACHER':
            qs = qs.filter(teacher_id=user.id)
        elif user.role == 'SUBJECT_TEACHER':
            class_ids = Subject.objects.filter(
                teacher_id=user.id, school_id=user.school_id
            ).values_list('class_group_id', flat=True).distinct()
            qs = qs.filter(id__in=list(class_ids))
        return qs

    def perform_create(self, serializer):
        serializer.save(school_id=self.request.user.school_id)

    @action(detail=True, methods=['put', 'patch'])
    def assign_teacher(self, request, pk=None):
        if not user_has_permission(request.user, 'classes.assign_teacher'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        class_group = self.get_object()
        teacher_id = request.data.get('teacherId')
        if teacher_id:
            class_group.teacher_id = teacher_id
            class_group.save(update_fields=['teacherId'])
        elif 'teacherId' in request.data and request.data['teacherId'] is None:
            class_group.teacher = None
            class_group.save(update_fields=['teacherId'])
        return Response(ClassGroupSerializer(class_group).data)
