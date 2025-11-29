from django.urls import path, re_path
from .views import GenerateView, GenerateMultiView,api_test, GenerateVariationsView
from .consumers import SketchConsumer

urlpatterns = [
    path('', api_test, name='api_test'),

    #as_view() is a class method provided by Django that wrpas your view class
    #instantiates it when a request comes in,
    #returns a function that Django's URL dispatcher can call.
    path('generate/', GenerateView.as_view(), name='generate_mockup'),
    path('generate-multi/', GenerateMultiView.as_view(), name='generate_multi'),
    path('generate-variations/', GenerateVariationsView.as_view(), name='generate_variations'),
    re_path(r"ws/collab/(?P<collabID>\d+)/$", SketchConsumer.as_asgi())
]
