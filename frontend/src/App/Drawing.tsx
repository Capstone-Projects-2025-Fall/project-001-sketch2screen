import React, { useCallback, useImperativeHandle, useRef, useEffect} from "react";
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  AppState,
  BinaryFiles,
  Collaborator
} from "@excalidraw/excalidraw/types";
type NormalizedZoomValue = number;
import "@excalidraw/excalidraw/index.css";
import {generateDiff, clone} from "./util.ts";

export type SceneData = {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
};

export type SceneUpdate = {
  elements?: readonly ExcalidrawElement[] | undefined;
  appState?: Partial<AppState> | undefined;
  files?: BinaryFiles | undefined;
  collaborators?: Map<string, Collaborator> | undefined;
}

/** Interface for methods exposed to parent components via ref */
export type DrawingHandle = {
  /** Exports the current drawing as a PNG blob */
  getPNGBlob: () => Promise<Blob | null>;
  updateScene: (scene: SceneUpdate) => void;
};

//Props that can be passed into <Drawing />
export interface DrawingProps {
  className?: string;
  visible?: boolean;
  initialScene?: SceneData;
  onSceneChange?: (scene: SceneData) => void;
  ref: (ref: DrawingHandle | null) => void;
}

/** Type representing Excalidraw's API methods */
type ExcalidrawAPI = NonNullable<
  Parameters<
    NonNullable<React.ComponentProps<typeof Excalidraw>["excalidrawAPI"]>
  >[0]
>;

/**
 * Drawing component wrapping Excalidraw with custom functionality
 * @param props - Component properties
 * @param ref - Forwarded ref for accessing component methods
 */
function Drawing(
  { className, visible, initialScene, onSceneChange, ref }: DrawingProps
) {
  /** Reference to Excalidraw's API methods */
  const excaliRef = useRef<ExcalidrawAPI | null>(null);

  //flag to skip onChange right after initial load
  const skipNextOnChange = useRef(0);

  const lastChangeRef = useRef(clone({elements: initialScene?.elements, files: initialScene?.files}));

  const pendingChangeHandlerRef =  useRef(false);

  useEffect(() => {
    if (initialScene){
      skipNextOnChange.current = 1;
    }
  }, []);

  /**
   * Exports the current drawing as a PNG blob
   * @returns Promise resolving to PNG blob or null if export fails
   */
  const getPNGBlob = useCallback(async (): Promise<Blob | null> => {
    const api = excaliRef.current;
    if (!api) return null;

    //Get everything user has drawn
    const elements = api.getSceneElements();
    if (!elements || !elements.length){
      console.log("No elements to export");
      return null;
    }

    //Capture background color, theme and etc
    const appState = api.getAppState();
    //Capture embedded files (images)
    const files = api.getFiles?.() ?? {};

    // Built-in export with white background
    return await exportToBlob({
      elements,
      appState: {
        ...appState,
        exportBackground: true,
        exportWithDarkMode: false,
      },
      files,
      mimeType: "image/png",
      quality: 1,
      backgroundColor: "white",
    });
  }, []);

  function updateScene(scene: SceneUpdate) {
    skipNextOnChange.current = 1;
    excaliRef.current?.updateScene({
      ...scene,
      collaborators: scene.collaborators as any,
      appState: undefined
    });
  }


  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getPNGBlob,
    updateScene,
  }));

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%", // fill the area under navbar
        display: visible ? "block" : "none",
      }}
    >
      <Excalidraw
        excalidrawAPI={(api) => {
          excaliRef.current = api;

          const initialAppState = api.getAppState();
          api.updateScene({
            appState: {
              ...initialAppState,
              zoom: { value: 1 as any },
              scrollX: 0,
              scrollY: 0,
            },
          });
        }}

        // Load the page scene on mount
        initialData={
          initialScene
        }
        onChange={(elements, appState, files) => {
          if(pendingChangeHandlerRef.current) return;
          else pendingChangeHandlerRef.current = true;
          setTimeout(() => {
            if(!excaliRef.current) return;

            let elements = excaliRef.current.getSceneElementsIncludingDeleted()
            let appState = excaliRef.current.getAppState()
            let files = excaliRef.current.getFiles()

            pendingChangeHandlerRef.current = false;
            console.log("🟡 onChange fired", {
              skipNext: skipNextOnChange.current,
              elementsCount: elements?.length,
              hasElements: !!elements
            });

            if (skipNextOnChange.current) {
              console.log("🔴 Skipping due to skipNextOnChange");

              skipNextOnChange.current--;
              return;
            }

            //Guard against duplicate calls
            
            if (
              generateDiff({elements, appState, files}, lastChangeRef.current) === undefined
            ) {
              // Skip duplicate calls
              console.log("🟤 Skipping duplicate onChange");

              return;
            }

            lastChangeRef.current = clone({elements, appState, files});
            
            onSceneChange?.({
              elements: elements ?? ([] as readonly ExcalidrawElement[]),
              appState: appState ?? {},
              files: files ?? {},
            })
          }, 50);
        }}

        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: false,
            loadScene: false,
            saveAsImage: false,
            export: false,
            toggleTheme: false,
          },
        }}
      />
    </div>
  );
};

export default Drawing;
