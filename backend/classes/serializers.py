from rest_framework import serializers
from .models import ClassGroup


class ClassGroupSerializer(serializers.ModelSerializer):
    is_class_teacher = serializers.SerializerMethodField()

    class Meta:
        model = ClassGroup
        fields = '__all__'
        read_only_fields = ('id', 'school')

    def get_is_class_teacher(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.teacher_id == request.user.id
        return False
