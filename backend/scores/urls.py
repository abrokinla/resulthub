from rest_framework.routers import DefaultRouter
from .views import AssessmentViewSet, ScoreSummaryViewSet

router = DefaultRouter()
router.register('assessments', AssessmentViewSet, basename='assessment')
router.register('scores', ScoreSummaryViewSet, basename='score')
urlpatterns = router.urls
