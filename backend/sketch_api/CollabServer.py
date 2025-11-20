from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def applyDiff(base, diff):
    if type(diff) != dict and type(diff) != list:
        return diff

    wasList = False

    if type(diff) == list:
        diff = {str(key): value for key, value in enumerate(diff)}
        wasList = True
    if type(base) == list:
        base = {str(key): value for key, value in enumerate(base)}
        wasList = True

    if not base:
        return diff

    retval = {}

    for (key, value) in base.items():
        if key.isdigit():
            wasList = True
        if key in diff:
            applied = applyDiff(value, diff[key])
            retval[key] = applied
        else:
            retval[key] = value

    for (key, value) in diff.items():
        if key.isdigit():
            wasList = True
        if key not in base:
            retval[key] = value

    if wasList:
        retval = [retval[x] for x, _ in retval.items()]
    return retval

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


        match.sceneData = applyDiff(match.sceneData, sceneData)


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


