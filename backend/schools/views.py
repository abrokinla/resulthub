from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import School, SchoolConfig, Term, ExamPeriod
from .serializers import (
    SchoolListSerializer, SchoolConfigSerializer,
    TermSerializer, ExamPeriodSerializer,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_school(request, slug):
    try:
        school = School.objects.get(slug=slug)
    except School.DoesNotExist:
        return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = SchoolListSerializer(school)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_school_config(request):
    user = request.user
    if not user.school_id:
        return Response({'error': 'User not associated with a school'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        config = SchoolConfig.objects.get(school_id=user.school_id)
    except SchoolConfig.DoesNotExist:
        return Response({'error': 'Config not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = SchoolConfigSerializer(config)
    return Response(serializer.data)


class TermViewSet(viewsets.ModelViewSet):
    serializer_class = TermSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.school_id:
            return Term.objects.filter(school_id=user.school_id)
        return Term.objects.none()

    def perform_create(self, serializer):
        serializer.save(school_id=self.request.user.school_id)


class ExamPeriodViewSet(viewsets.ModelViewSet):
    serializer_class = ExamPeriodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.school_id:
            return ExamPeriod.objects.filter(term__school_id=user.school_id)
        return ExamPeriod.objects.none()

    def perform_create(self, serializer):
        serializer.save()
