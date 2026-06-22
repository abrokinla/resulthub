from rest_framework import serializers
from .models import ClassGroup


class ClassGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassGroup
        fields = '__all__'
        read_only_fields = ('id', 'school')
