from django.urls import path, re_path
from .views import GenerateView, test_api
from .consumers import SketchConsumer

urlpatterns = [
    path('', test_api, name='test_api'),

    #as_view() is a class method provided by Django that wrpas your view class
    #instantiates it when a request comes in,
    #returns a function that Django's URL dispatcher can call.
    path('generate/', GenerateView.as_view(), name='generate_mockup'),
    re_path(r"ws/collab/(?P<collabID>\d+)/$", SketchConsumer.as_asgi())
]
