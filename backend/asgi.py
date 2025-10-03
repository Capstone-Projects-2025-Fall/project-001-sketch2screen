"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from django.urls import include
from channels.routing import URLRouter, ProtocolTypeRouter

from . import sketch_api

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

asgi_app = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": asgi_app,
        "websocket": URLRouter(sketch_api.urls.urlpatterns),
    }
)
