from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
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
