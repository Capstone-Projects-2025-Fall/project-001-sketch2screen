from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class SingletonMeta(type):
    _instance = None
    def __call__(cls, *args, **kwargs):
        if cls._instance == None:
            cls._instance = super(SingletonMeta, cls).__call__(*args, **kwargs)
        return cls._instance

class CollabServer(metaclass=SingletonMeta):
    def sendSceneUpdate(self, userID, sketchID, sketchData):
        async_to_sync(get_channel_layer().send)(userID, {
            "type": "scene.update",
            "sketchID": sketchID,
            "sketchData": sketchData
            })

    def sendPageUpdate(self, userID, sketchID, pageName):
        async_to_sync(get_channel_layer().send)(userID, {
            "type": "page.update",
            "sketchID": sketchID,
            "pageName": pageName
            })

#handler methods - define in STS-26
    def onNewConnection(self, userID, collabID):
        print(f"New connection from {userID} in collab {collabID}")
    def onSceneUpdate(self, userID, collabID, sketchID, sketchData):
        self.sendSceneUpdate(userID, sketchID, sketchData)
        print(f"Scene update from {userID} in collab {collabID}")
        pass
    def onPageUpdate(self, userID, collabID, sketchID, pageName):
        self.sendPageUpdate(userID, sketchID, pageName)
        print(f"Page update from {userID} in collab {collabID}")
        pass
    def onConnectionEnd(self, userID):
        print(f"Disconnection from {userID}")
        pass
