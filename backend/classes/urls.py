from rest_framework.routers import DefaultRouter
from .views import ClassGroupViewSet

router = DefaultRouter()
router.register('classes', ClassGroupViewSet, basename='class')
urlpatterns = router.urls
