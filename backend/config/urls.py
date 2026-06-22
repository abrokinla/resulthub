from django.urls import path, include

urlpatterns = [
    path('api/', include('accounts.urls')),
    path('api/', include('schools.urls')),
    path('api/', include('classes.urls')),
    path('api/', include('students.urls')),
    path('api/', include('subjects.urls')),
    path('api/', include('scores.urls')),
    path('api/', include('results.urls')),
]
