import type { SceneData } from "@excalidraw/excalidraw/types"

/** Client for handling real-time collaboration features */
export default class CollabClient {
  /** Unique identifier for this collaboration session */
  collabID: number;

  /**
   * Creates a new collaboration client
   * @param collabID - Unique identifier for this collaboration session
   */
  constructor(collabID: number) {
    this.collabID = collabID
  }

  /**
   * Sets up handler for receiving scene updates from other clients
   * @param handler - Callback function that processes received scene updates
   * @param handler.sketchID - ID of the sketch that was updated
   * @param handler.sceneData - New scene data received from collaborator
   */
  setUpdateHandler(handler: (sketchID: number, sceneData: SceneData) => void) {
  }

  /**
   * Sends scene updates to other clients
   * @param sketchID - ID of the sketch being updated
   * @param sceneData - New scene data to send to collaborators
   */
  sendSceneUpdate(sketchID: number, sceneData: SceneData) {
  }

  /**
   * Sets up handler for receiving page updates from other clients
   * @param handler - Callback function that processes received page updates
   * @param handler.sketchID - ID of the sketch page that was updated
   * @param handler.name - New name of the page, or null if page was deleted
   */
  setPageUpdateHandler(handler: (sketchID: number, name: string | null) => void) {
  }

  /**
   * Sends page updates to other clients
   * @param sketchID - ID of the sketch page being updated
   * @param name - New name for the page, or null if page is being deleted
   */
  sendPageUpdate(sketchID: number, name: string | null) {
  }
}
