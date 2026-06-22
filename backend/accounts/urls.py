from django.urls import path
from . import views

urlpatterns = [
    path('auth/register/', views.register_school, name='register-school'),
    path('auth/login/', views.login, name='login'),
    path('auth/me/', views.me, name='me'),
    path('users/', views.list_users, name='list-users'),
]
