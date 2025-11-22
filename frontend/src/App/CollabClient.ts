import type { SceneData } from "./Drawing"

/** Information about a collaborator */
export interface CollaboratorInfo {
  id: string;
  username: string;
  pointer?: { x: number; y: number };
}

/** Client for handling real-time collaboration features */
export default class CollabClient {
  /** Unique identifier for this collaboration session */
  collabID: number;

  /** This user's unique ID */
  userID: string;

  /** This user's username */
  username: string;

  /** Connection to server */
  connection: WebSocket;

  sceneUpdateHandler: ((sketchID: string, sceneData: SceneData) => void) | null = null
  pageUpdateHandler: ((sketchID: string, name: string | null) => void) | null = null
  collaboratorJoinHandler: ((collaborator: CollaboratorInfo) => void) | null = null
  collaboratorLeaveHandler: ((userID: string) => void) | null = null
  collaboratorPointerHandler: ((userID: string, pointer: { x: number; y: number } | null) => void) | null = null

  /**
   * Creates a new collaboration client
   * @param collabID - Unique identifier for this collaboration session
   * @param username - This user's display name
   */
  constructor(collabID: number, username: string) {
    this.collabID = collabID
    this.username = username
    // Generate a unique user ID for this session
    this.userID = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    let proto = "ws://"

    if(window.location.protocol == "https:") {
      proto = "wss://"
    }

    this.connection = new WebSocket(proto+window.location.hostname+":"+window.location.port+"/ws/collab/"+collabID+"/")
   
    // Note: onopen handler is set by useCollaboration hook
   
    this.connection.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
   
    this.connection.onclose = () => {
      console.log("WebSocket disconnected")
    }
   
    this.connection.onmessage = (event) => {
      let message = JSON.parse(event.data)
      let action = message.action
      
      // Filter: only accept messages where sketchID starts with our collabID
      // This prevents cross-contamination between different collab sessions
      if (action === "scene_update" || action === "page_update") {
        const sketchID = message.sketchID;
        const expectedPrefix = `${this.collabID}-`;
        
        if (!sketchID || !sketchID.startsWith(expectedPrefix)) {
          console.log(`Ignoring message for different collab session. Expected prefix: ${expectedPrefix}, got: ${sketchID}`);
          return;
        }
      }
      
      if(action === "scene_update") {
        if(this.sceneUpdateHandler) {
          this.sceneUpdateHandler(message.sketchID, message.sketchData)
        }
      }
      else if(action === "page_update") {
        if(this.pageUpdateHandler) {
          this.pageUpdateHandler(message.sketchID, message.pageName)
        }
      }
      else if(action === "collaborator_join") {
        if(this.collaboratorJoinHandler) {
          this.collaboratorJoinHandler({
            id: message.userID,
            username: message.username,
            pointer: message.pointer
          })
        }
      }
      else if(action === "collaborator_leave") {
        if(this.collaboratorLeaveHandler) {
          this.collaboratorLeaveHandler(message.userID)
        }
      }
      else if(action === "collaborator_pointer") {
        if(this.collaboratorPointerHandler) {
          this.collaboratorPointerHandler(message.userID, message.pointer)
        }
      }
    }
  }

  /**
   * Sets up handler for receiving scene updates from other clients
   * @param handler - Callback function that processes received scene updates
   * @param handler.sketchID - ID of the sketch that was updated
   * @param handler.sceneData - New scene data received from collaborator
   */
  setSceneUpdateHandler(handler: (sketchID: string, sceneData: SceneData) => void) {
    this.sceneUpdateHandler = handler
  }


  /**
   * Sends scene updates to other clients
   * @param sketchID - ID of the sketch being updated
   * @param sceneData - New scene data to send to collaborators
   */
  sendSceneUpdate(sketchID: string, sceneData: SceneData) {
    if (this.connection.readyState === WebSocket.OPEN) {
      try {
        // Create a clean, serializable copy of the scene data
        // Remove non-serializable properties like collaborators (Map object)
        const cleanAppState = sceneData.appState ? {...sceneData.appState} : {};
        delete cleanAppState.collaborators; // Remove Map object
       
        const cleanSceneData = {
          elements: sceneData.elements ? JSON.parse(JSON.stringify(sceneData.elements)) : [],
          appState: cleanAppState,
          files: sceneData.files ? JSON.parse(JSON.stringify(sceneData.files)) : {}
        };
       
        this.connection.send(JSON.stringify({
          action: "scene_update",
          sketchID: sketchID,
          sketchData: cleanSceneData
        }));
      } catch (error) {
        console.error("Failed to send scene update:", error);
      }
    } else {
      console.warn("WebSocket not open, cannot send scene update");
    }
  }


  /**
   * Sets up handler for receiving page updates from other clients
   * @param handler - Callback function that processes received page updates
   * @param handler.sketchID - ID of the sketch page that was updated
   * @param handler.name - New name of the page, or null if page was deleted
   */
  setPageUpdateHandler(handler: (sketchID: string, name: string | null) => void) {
    this.pageUpdateHandler = handler
  }


  /**
   * Sends page updates to other clients
   * @param sketchID - ID of the sketch page being updated
   * @param pageName - New name for the page, or null if page is being deleted
   */
  sendPageUpdate(sketchID: string, pageName: string | null) {
    if (this.connection.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify({
        action: "page_update",
        sketchID: sketchID,
        pageName: pageName
      }))
    }
  }

  /**
   * Sets up handler for when collaborators join
   */
  setCollaboratorJoinHandler(handler: (collaborator: CollaboratorInfo) => void) {
    this.collaboratorJoinHandler = handler
  }

  /**
   * Sets up handler for when collaborators leave
   */
  setCollaboratorLeaveHandler(handler: (userID: string) => void) {
    this.collaboratorLeaveHandler = handler
  }

  /**
   * Sets up handler for collaborator pointer updates
   */
  setCollaboratorPointerHandler(handler: (userID: string, pointer: { x: number; y: number } | null) => void) {
    this.collaboratorPointerHandler = handler
  }

  /**
   * Sends join message to server with username
   */
  sendCollaboratorJoin() {
    if (this.connection.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify({
        action: "collaborator_join",
        userID: this.userID,
        username: this.username
      }))
    }
  }

  /**
   * Sends pointer position update to other clients
   * @param pointer - Current pointer coordinates, or null to hide pointer
   */
  sendPointerUpdate(pointer: { x: number; y: number } | null) {
    if (this.connection.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify({
        action: "collaborator_pointer",
        userID: this.userID,
        pointer: pointer
      }))
    }
  }
}