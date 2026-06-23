from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ClassGroup
from .serializers import ClassGroupSerializer


class ClassGroupViewSet(viewsets.ModelViewSet):
    serializer_class = ClassGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.school_id:
            return ClassGroup.objects.filter(school_id=user.school_id)
        return ClassGroup.objects.none()

    def perform_create(self, serializer):
        serializer.save(school_id=self.request.user.school_id)

    @action(detail=True, methods=['put', 'patch'])
    def assign_teacher(self, request, pk=None):
        class_group = self.get_object()
        teacher_id = request.data.get('teacherId')
        if teacher_id:
            class_group.teacher_id = teacher_id
            class_group.save(update_fields=['teacherId'])
        elif 'teacherId' in request.data and request.data['teacherId'] is None:
            class_group.teacher = None
            class_group.save(update_fields=['teacherId'])
        return Response(ClassGroupSerializer(class_group).data)
