import type {SceneData, } from "@excalidraw/excalidraw/types"

export default class CollabClient {
  collabID: number;

  constructor(collabID : number) {
    this.collabID = collabID
  }
  setUpdateHandler(handler: (sketchID: number, sceneData: SceneData) => void) {
  }
  sendSceneUpdate(sketchID: number, sceneData: SceneData) {
  }

  //name == null means page is deleted
  setPageUpdateHandler(handler: (sketchID: number, name: string | null) => void) {
  }
  sendPageUpdate(sketchID: number, name: string | null) {
  }
}
