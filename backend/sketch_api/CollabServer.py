from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class SingletonMeta(type):
    _instance = None
    def __call__(cls, *args, **kwargs):
        if cls._instance == None:
            cls._instance = super(SingletonMeta, cls).__call__(*args, **kwargs)
        return cls._instance




class CollabSession():
    members = []
    sketches = []


class Sketch():
    def __init__(self, name, ID, sceneData):
        self.name = name
        self.ID = ID
        self.sceneData = sceneData


class CollabServer(metaclass=SingletonMeta):
    def sendSceneUpdate(self, userID, sketchID, sceneData):
        async_to_sync(get_channel_layer().send)(userID, {
            "type": "scene.update",
            "sketchID": sketchID,
            "sketchData": sceneData
            })


    def sendPageUpdate(self, userID, sketchID, pageName):
        async_to_sync(get_channel_layer().send)(userID, {
            "type": "page.update",
            "sketchID": sketchID,
            "pageName": pageName
            })


#handler methods - define in STS-26
    collabSessions = {}


    def onNewConnection(self, userID, collabID):
        print(f"New connection from {userID} in collab {collabID}")


        if not collabID in self.collabSessions:
            self.collabSessions[collabID] = CollabSession()
            print(f"collab session created")


        self.collabSessions[collabID].members.append(userID)


        for sketch in self.collabSessions[collabID].sketches:
            self.sendPageUpdate(userID, sketch.ID, sketch.name)
            self.sendSceneUpdate(userID, sketch.ID, sketch.sceneData)


    def onSceneUpdate(self, userID, collabID, sketchID, sceneData):
        print(f"Scene update from {userID} in collab {collabID}")


        session = self.collabSessions[collabID]


        match = [x for x in session.sketches if x.ID == sketchID]


        if len(match) == 0:
            print(f"discarding invalid scene update")
            return
        else: match = match[0]


        match.sceneData = sceneData


        for member in session.members:
            if member != userID:
                self.sendSceneUpdate(member, sketchID, sceneData)


    def onPageUpdate(self, userID, collabID, sketchID, pageName):
        print(f"Page update from {userID} in collab {collabID}")


        session = self.collabSessions[collabID]


        match = [x for x in session.sketches if x.ID == sketchID]
        if len(match) == 0:
            session.sketches.append(Sketch(pageName, sketchID, {}))
            match = session.sketches[-1]
        else:
            match = match[0]
            if pageName is None:
                session.sketches.remove(match)
                print(f"deleting sketch {match}")
            else:
                match.name = pageName


        for member in session.members:
            if member != userID:
                self.sendPageUpdate(member, sketchID, pageName)


    def onConnectionEnd(self, userID, collabID):
        print(f"Disconnection from {userID}")
        self.collabSessions[collabID].members.remove(userID)
        if len(self.collabSessions[collabID].members) == 0:
            self.collabSessions.pop(collabID)
            print(f"Ended collab {collabID}")


