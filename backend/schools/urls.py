from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('terms', views.TermViewSet, basename='term')
router.register('exam-periods', views.ExamPeriodViewSet, basename='exam-period')

urlpatterns = [
    path('schools/<slug:slug>/', views.get_school, name='school-detail'),
    path('schools/upload-logo/', views.upload_logo, name='upload-logo'),
    path('config/', views.school_config, name='school-config'),
]

urlpatterns += router.urls
