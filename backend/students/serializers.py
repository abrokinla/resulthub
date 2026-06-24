from rest_framework import serializers
from .models import Student, AcademicRecord


class StudentSerializer(serializers.ModelSerializer):
    className = serializers.SerializerMethodField()

    class Meta:
        model = Student
        exclude = ('parent_pin_hash',)
        read_only_fields = ('id', 'school')

    def get_className(self, obj):
        return obj.class_group.name if obj.class_group else None

    def create(self, validated_data):
        validated_data['school_id'] = self.context['request'].user.school_id
        return super().create(validated_data)


class AcademicRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicRecord
        fields = '__all__'
        read_only_fields = ('id',)
