from rest_framework import serializers
from .models import User, TeacherProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role', 'school')
        read_only_fields = ('id',)


class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherProfile
        fields = ('phone', 'address', 'profile_picture', 'resume', 'certificates')


class CombinedProfileSerializer(serializers.ModelSerializer):
    teacher_profile = TeacherProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role', 'phone', 'school', 'teacher_profile')
        read_only_fields = ('id', 'email', 'role', 'school')


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(min_length=1)
    new_password = serializers.CharField(min_length=6)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect')
        return value


class RegisterSchoolSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6)
    school_name = serializers.CharField(max_length=255)
    school_address = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
