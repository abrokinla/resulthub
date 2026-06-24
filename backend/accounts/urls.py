from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('auth/register/', views.register_school, name='register-school'),
    path('auth/login/', views.login, name='login'),
    path('auth/me/', views.me, name='me'),
    path('auth/profile/', views.profile, name='profile'),
    path('auth/change-password/', views.change_password, name='change-password'),
    path('auth/upload-profile-picture/', views.upload_profile_picture, name='upload-profile-picture'),
    path('auth/upload-credential/', views.upload_credential, name='upload-credential'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('users/', views.list_users, name='list-users'),
    path('teacher/create/', views.create_teacher, name='create-teacher'),
    path('teacher/resend-invitation/', views.resend_teacher_invitation, name='resend-teacher-invitation'),
]
