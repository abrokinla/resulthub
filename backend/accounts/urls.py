from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('auth/register/', views.register_school, name='register-school'),
    path('auth/login/', views.login, name='login'),
    path('auth/me/', views.me, name='me'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('users/', views.list_users, name='list-users'),
    path('teacher/create/', views.create_teacher, name='create-teacher'),
]
