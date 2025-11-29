import type { SceneData } from "./Drawing";

/** Represents a single sketch page with its metadata and content */
export type SketchPage = {
  /** Unique identifier for the page */
  id: string;
  /** Display name of the page */
  name: string;
  /** Excalidraw scene data containing elements, state and files */
  scene: SceneData;
};