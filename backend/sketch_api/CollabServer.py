from channels.layers import get_channel_layer

class SingletonMeta(type):
    _instance = None
    def __call__(cls, *args, **kwargs):
        if cls._instance == None:
            cls._instance = super(SingletonMeta, cls).__call__(*args, **kwargs)
        return cls._instance

class CollabServer(metaclass=SingletonMeta):
    def sendSceneUpdate(userID, sketchID, sketchData):
        async_to_sync(get_channel_layer().send)(userID, {
            "type": "scene.update",
            "sketchID": sketchID,
            "sketchData": sketchData
            })

    def sendPageUpdate(userID, sketchID, name):
        async_to_sync(get_channel_layer().send)(userID, {
            "type": "page.update",
            "sketchID": sketchID,
            "name": name
            })

#handler methods - define in STS-26
    def onNewConnection(userID, collabID):
        pass
    def onSceneUpdate(userID, collabID, sketchID, sketchData):
        pass
    def onPageUpdate(userID, collabID, sketchID, name):
        pass
    def onConnectionEnd(userID):
        pass
