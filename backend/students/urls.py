from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, AcademicRecordViewSet

router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('academic-records', AcademicRecordViewSet, basename='academic-record')
urlpatterns = router.urls
