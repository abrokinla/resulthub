from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('students', views.StudentViewSet, basename='student')
router.register('academic-records', views.AcademicRecordViewSet, basename='academic-record')
urlpatterns = [
    path('student/create/', views.create_student, name='create-student'),
]
urlpatterns += router.urls
