from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('subjects', views.SubjectViewSet, basename='subject')
router.register('student-subjects', views.StudentSubjectViewSet, basename='student-subject')
urlpatterns = [
    path('subject/create/', views.create_subject, name='create-subject'),
    path('subject/assign-all/', views.assign_all_subjects, name='assign-all-subjects'),
]
urlpatterns += router.urls
