from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def applyDiff(base, diff):
    if type(base) == None:
        return diff
    if type(diff) == None:
        return None
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


class Collaborator():
    def __init__(self, userID, username, channelName):
        self.userID = userID
        self.username = username
        self.channelName = channelName  # WebSocket channel name for this user
        self.pointer = None  # {x, y} or None
        self.currentPage = None  # Track which page this user is currently on


class CollabSession():
    def __init__(self):
        self.members = []  # List of channel names (for backwards compatibility)
        self.collaborators = {}  # Dict of userID -> Collaborator
        self.sketches = []


class Sketch():
    def __init__(self, name, ID, sceneData):
        self.name = name
        self.ID = ID
        self.sceneData = sceneData


class CollabServer(metaclass=SingletonMeta):
    def sendSceneUpdate(self, channelName, sketchID, sceneData):
        async_to_sync(get_channel_layer().send)(channelName, {
            "type": "scene.update",
            "sketchID": sketchID,
            "sketchData": sceneData
            })

    def sendPageUpdate(self, channelName, sketchID, pageName):
        async_to_sync(get_channel_layer().send)(channelName, {
            "type": "page.update",
            "sketchID": sketchID,
            "pageName": pageName
            })

    def sendCollaboratorJoin(self, channelName, userID, username, pointer=None):
        async_to_sync(get_channel_layer().send)(channelName, {
            "type": "collaborator.join",
            "userID": userID,
            "username": username,
            "pointer": pointer
            })

    def sendCollaboratorLeave(self, channelName, userID):
        async_to_sync(get_channel_layer().send)(channelName, {
            "type": "collaborator.leave",
            "userID": userID
            })

    def sendCollaboratorPointer(self, channelName, userID, pointer, pageID=None):
        async_to_sync(get_channel_layer().send)(channelName, {
            "type": "collaborator.pointer",
            "userID": userID,
            "pointer": pointer,
            "pageID": pageID
            })

    #handler methods - define in STS-26
    collabSessions = {}

    def onNewConnection(self, channelName, collabID):
        print(f"New connection from {channelName} in collab {collabID}")

        if not collabID in self.collabSessions:
            self.collabSessions[collabID] = CollabSession()
            print(f"collab session created")

        self.collabSessions[collabID].members.append(channelName)

        # Send existing sketches to new connection
        for sketch in self.collabSessions[collabID].sketches:
            self.sendPageUpdate(channelName, sketch.ID, sketch.name)
            self.sendSceneUpdate(channelName, sketch.ID, sketch.sceneData)

        # Send existing collaborators to new connection
        print(f"Sending {len(self.collabSessions[collabID].collaborators)} existing collaborators to new user")
        for userID, collaborator in self.collabSessions[collabID].collaborators.items():
            print(f"  - Sending collaborator: {collaborator.username} ({userID})")
            self.sendCollaboratorJoin(channelName, userID, collaborator.username, collaborator.pointer)

        # Send existing collaborators to new connection
        for userID, collaborator in self.collabSessions[collabID].collaborators.items():
            self.sendCollaboratorJoin(channelName, userID, collaborator.username, collaborator.pointer)

    def onCollaboratorJoin(self, channelName, collabID, userID, username):
        print(f"Collaborator join: {username} ({userID}) in collab {collabID}")

        session = self.collabSessions[collabID]

        # Create and store collaborator info
        collaborator = Collaborator(userID, username, channelName)
        session.collaborators[userID] = collaborator

        # Broadcast join to all OTHER members
        for member in session.members:
            if member != channelName:
                self.sendCollaboratorJoin(member, userID, username, None)

    def onCollaboratorPointer(self, channelName, collabID, userID, pointer, pageID=None):
        session = self.collabSessions[collabID]

        # Update stored pointer position and current page
        if userID in session.collaborators:
            session.collaborators[userID].pointer = pointer
            session.collaborators[userID].currentPage = pageID

        # Broadcast pointer update to all OTHER members
        # Include the pageID so clients can filter
        for member in session.members:
            if member != channelName:
                self.sendCollaboratorPointer(member, userID, pointer, pageID)

    def onSceneUpdate(self, channelName, collabID, sketchID, sceneData):
        print(f"Scene update from {channelName} in collab {collabID}")

        session = self.collabSessions[collabID]

        match = [x for x in session.sketches if x.ID == sketchID]

        if len(match) == 0:
            print(f"discarding invalid scene update")
            return
        else: 
            match = match[0]

        match.sceneData = applyDiff(match.sceneData, sceneData)

        for member in session.members:
            if member != channelName:
                self.sendSceneUpdate(member, sketchID, sceneData)

    def onPageUpdate(self, channelName, collabID, sketchID, pageName):
        print(f"Page update from {channelName} in collab {collabID}")

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
            if member != channelName:
                self.sendPageUpdate(member, sketchID, pageName)

    def onConnectionEnd(self, channelName, collabID):
        print(f"Disconnection from {channelName}")
        
        session = self.collabSessions[collabID]
        session.members.remove(channelName)

        # Find and remove the collaborator associated with this channel
        userID_to_remove = None
        for userID, collaborator in session.collaborators.items():
            if collaborator.channelName == channelName:
                userID_to_remove = userID
                break

        if userID_to_remove:
            del session.collaborators[userID_to_remove]
            # Broadcast leave to remaining members
            for member in session.members:
                self.sendCollaboratorLeave(member, userID_to_remove)

        if len(session.members) == 0:
            self.collabSessions.pop(collabID)
            print(f"Ended collab {collabID}")
