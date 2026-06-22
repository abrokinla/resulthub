from rest_framework import serializers
from .models import Assessment, ScoreSummary


class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = '__all__'
        read_only_fields = ('id',)


class ScoreSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ScoreSummary
        fields = '__all__'
        read_only_fields = ('id',)
