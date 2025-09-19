from django.urls import path
from . import views

urlpatterns = [
    path('', views.test_api, name='test_api'),
    path('generate/', views.generate_mockup, name='generate_mockup'),
]
