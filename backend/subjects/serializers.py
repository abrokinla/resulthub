from rest_framework import serializers
from .models import Subject, StudentSubject


class SubjectSerializer(serializers.ModelSerializer):
    class_group_name = serializers.CharField(source='class_group.name', read_only=True)
    class_group_section = serializers.CharField(source='class_group.section', read_only=True)

    class Meta:
        model = Subject
        fields = '__all__'
        read_only_fields = ('id', 'school')


class StudentSubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSubject
        fields = '__all__'
        read_only_fields = ('id',)
