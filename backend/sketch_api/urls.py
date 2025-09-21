from django.urls import path
from . import views

urlpatterns = [
    path('', views.test_api, name='test_api'),

    #as_view() is a class method provided by Django that wrpas your view class
    #instantiates it when a request comes in,
    #returns a function that Django's URL dispatcher can call.
    path('generate/', views.GenerateView, name='generate_mockup'),
]
