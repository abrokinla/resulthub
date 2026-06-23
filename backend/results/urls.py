from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('results', views.ResultViewSet, basename='result')

urlpatterns = [
    path('results/<str:pk>/approve/', views.approve_result, name='approve-result'),
    path('results/computed/<str:class_id>/<str:term_id>/', views.get_computed_results, name='computed-results'),
    path('public/access/<str:reg_number>/<str:pin>/', views.public_access, name='public-access'),
    path('promotion/process/', views.process_promotion, name='process-promotion'),
    path('result/approve/', views.approve_results_bulk, name='approve-results-bulk'),
    path('result/save-domains/', views.save_domains, name='save-domains'),
]

urlpatterns += router.urls
