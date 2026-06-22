from rest_framework import serializers
from .models import School, SchoolConfig, Term, ExamPeriod


class SchoolListSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'


class SchoolConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolConfig
        fields = '__all__'
        read_only_fields = ('id', 'school')


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = '__all__'
        read_only_fields = ('id', 'school')


class ExamPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamPeriod
        fields = '__all__'
        read_only_fields = ('id', 'term')
