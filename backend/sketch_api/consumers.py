from channels.generic.websocket import AsyncWebsocketConsumer
from .CollabServer import CollabServer
import channels.layers


class SketchConsumer(AsyncWebsocketConsumer):
    server = CollabServer()

    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        command = text_data[0]
        await self.send(text_data=text_data)

    async def scene_update(self, event):
        pass

    async def page_update(self, event):
        pass
