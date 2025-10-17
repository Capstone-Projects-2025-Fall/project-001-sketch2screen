from channels.generic.websocket import WebsocketConsumer
from .CollabServer import CollabServer
import channels.layers
import json
import uuid


class SketchConsumer(WebsocketConsumer):
    server = CollabServer()

    def connect(self):
        self.collabID = self.scope["url_route"]["kwargs"]["collabID"]
        self.server.onNewConnection(self.channel_name, self.collabID)
        self.accept()

    def disconnect(self, close_code):
        self.server.onConnectionEnd(self.channel_name)

    def receive(self, text_data):
        message = json.loads(text_data)
        action = message["action"]

        if action == "scene_update":
            self.server.onSceneUpdate(self.channel_name, self.collabID, message["sketchID"], message["sketchData"])

        if action == "page_update":
            self.server.onPageUpdate(self.channel_name, self.collabID, message["sketchID"], message["pageName"])

    def scene_update(self, event):
        self.send(text_data=json.dumps({
            "action": "scene_update",
            "sketchID": event["sketchID"],
            "sketchData": event["sketchData"]
        }))

    def page_update(self, event):
        self.send(text_data=json.dumps({
            "action": "page_update",
            "sketchID": event["sketchID"],
            "pageName": event["pageName"]
        }))
