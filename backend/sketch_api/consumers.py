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
        self.server.onConnectionEnd(self.channel_name, self.collabID)

    def receive(self, text_data):
        message = json.loads(text_data)
        action = message["action"]

        if action == "scene_update":
            self.server.onSceneUpdate(self.channel_name, self.collabID, message["sketchID"], message["sketchData"])

        elif action == "page_update":
            self.server.onPageUpdate(self.channel_name, self.collabID, message["sketchID"], message["pageName"])

        # Handle collaborator join
        elif action == "collaborator_join":
            self.server.onCollaboratorJoin(
                self.channel_name,
                self.collabID,
                message["userID"],
                message["username"]
            )

        # Handle collaborator pointer updates
        elif action == "collaborator_pointer":
            self.server.onCollaboratorPointer(
                self.channel_name,
                self.collabID,
                message["userID"],
                message.get("pointer")
            )

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

    # Send collaborator join to WebSocket
    def collaborator_join(self, event):
        self.send(text_data=json.dumps({
            "action": "collaborator_join",
            "userID": event["userID"],
            "username": event["username"],
            "pointer": event.get("pointer")
        }))

    # NEW: Send collaborator leave to WebSocket
    def collaborator_leave(self, event):
        self.send(text_data=json.dumps({
            "action": "collaborator_leave",
            "userID": event["userID"]
        }))

    # NEW: Send collaborator pointer update to WebSocket
    def collaborator_pointer(self, event):
        self.send(text_data=json.dumps({
            "action": "collaborator_pointer",
            "userID": event["userID"],
            "pointer": event["pointer"]
        }))