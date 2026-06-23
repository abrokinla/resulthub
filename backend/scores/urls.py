from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('assessments', views.AssessmentViewSet, basename='assessment')
router.register('scores', views.ScoreSummaryViewSet, basename='score')
urlpatterns = [
    path('score/update/', views.update_scores, name='update-scores'),
]
urlpatterns += router.urls
