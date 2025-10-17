import type { SceneData } from "@excalidraw/excalidraw/types"

/** Client for handling real-time collaboration features */
export default class CollabClient {
  /** Unique identifier for this collaboration session */
  collabID: number;

  /** Connection to server */
  connection: WebSocket;


  sceneUpdateHandler: ((sketchID: number, sceneData: SceneData) => void) | null = null
  pageUpdateHandler: ((sketchID: number, name: string | null) => void) | null = null

  /**
   * Creates a new collaboration client
   * @param collabID - Unique identifier for this collaboration session
   */
  constructor(collabID: number) {
    this.collabID = collabID
    this.connection = new WebSocket("ws://"+window.location.hostname+":"+window.location.port+"/ws/collab/"+collabID+"/")
    this.connection.onmessage = (event) => {
      let message = JSON.parse(event.data)
      let action = message.action
      if(action === "scene_update") {
        if(this.sceneUpdateHandler) {
          this.sceneUpdateHandler(message.sketchID, message.sceneData)
        }
      }
      if(action === "page_update") {
        if(this.pageUpdateHandler) {
          this.pageUpdateHandler(message.sketchID, message.pageName)
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
  setSceneUpdateHandler(handler: (sketchID: number, sceneData: SceneData) => void) {
    this.sceneUpdateHandler = handler
  }

  /**
   * Sends scene updates to other clients
   * @param sketchID - ID of the sketch being updated
   * @param sceneData - New scene data to send to collaborators
   */
  sendSceneUpdate(sketchID: number, sceneData: SceneData) {
    this.connection.send(JSON.stringify({
      action: "scene_update",
      sketchID: sketchID,
      sceneData: sceneData
    }))
  }

  /**
   * Sets up handler for receiving page updates from other clients
   * @param handler - Callback function that processes received page updates
   * @param handler.sketchID - ID of the sketch page that was updated
   * @param handler.name - New name of the page, or null if page was deleted
   */
  setPageUpdateHandler(handler: (sketchID: number, name: string | null) => void) {
    this.pageUpdateHandler = handler
  }

  /**
   * Sends page updates to other clients
   * @param sketchID - ID of the sketch page being updated
   * @param pageName - New name for the page, or null if page is being deleted
   */
  sendPageUpdate(sketchID: number, pageName: string | null) {
    this.connection.send(JSON.stringify({
      action: "page_update",
      sketchID: sketchID,
      pageName: pageName
    }))
  }
}
