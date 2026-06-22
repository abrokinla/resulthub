from rest_framework.routers import DefaultRouter
from .views import SubjectViewSet, StudentSubjectViewSet

router = DefaultRouter()
router.register('subjects', SubjectViewSet, basename='subject')
router.register('student-subjects', StudentSubjectViewSet, basename='student-subject')
urlpatterns = router.urls
