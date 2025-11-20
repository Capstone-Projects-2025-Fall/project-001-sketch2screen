import React, { forwardRef, useCallback, useImperativeHandle, useRef, useEffect} from "react";
import { Excalidraw, exportToBlob, restoreElements } from "@excalidraw/excalidraw";
import type { NormalizedZoomValue } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import {generateDiff} from "./util.ts";


/** Represents a complete Excalidraw scene with all its components */
export type SceneData = {
  /** Array of drawing elements */
  elements: readonly any[]; // ExcalidrawElement[]
  /** Application state including view settings */
  appState: any;   // AppState
  /** Map of binary files (like images) used in the scene */
  files: Record<string, any>; // BinaryFiles
};

/** Interface for methods exposed to parent components via ref */
export type DrawingHandle = {
  /** Exports the current drawing as a PNG blob */
  getPNGBlob: () => Promise<Blob | null>;
  updateScene: (scene: SceneData) => void;
};

//Props that can be passed into <Drawing />
export interface DrawingProps {
  /** CSS class name for styling */
  className?: string;
  /** Width of the drawing canvas */
  width?: number;
  /** Height of the drawing canvas */
  height?: number;
  /** Whether the drawing canvas is visible */
  visible?: boolean;
  /** Initial scene data to load */
  initialScene?: SceneData;
  /** Callback fired when the scene changes */
  onSceneChange?: (scene: SceneData) => void;
  /** Callback to receive Excalidraw API */
  onExcalidrawAPI?: (api: any) => void;

  ref: (ref: any) => void;
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
  { className, visible, initialScene, onSceneChange, onExcalidrawAPI, ref }: DrawingProps
) {
  /** Reference to Excalidraw's API methods */
  const excaliRef = useRef<ExcalidrawAPI | null>(null);

  //flag to skip onChange right after initial load
  const skipNextOnChange = useRef(0);

  const initialSceneCopy = initialScene ?? structuredClone(initialScene)

  const lastChangeRef = useRef({elements: initialSceneCopy?.elements, files: initialSceneCopy?.files});

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

  function updateScene(scene: SceneData) {
    skipNextOnChange.current = 1;
    //scene = {elements: restoreElements(scene.elements, excaliRef.current?.getSceneElements()), appState: scene.appState, files: scene.files}
    excaliRef.current?.updateScene(scene);
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
              zoom: { value: 1 as NormalizedZoomValue },
              scrollX: 0,
              scrollY: 0,
            },
          });
        }}

        // Load the page scene on mount
        initialData={
          initialSceneCopy
        }
        onChange={(elements, appState, files) => {
          if(pendingChangeHandlerRef.current) return;
          else pendingChangeHandlerRef.current = true;
          setTimeout(() => {
            if(!excaliRef.current) return;

            let elements = excaliRef.current.getSceneElements()
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
            
            if (excaliRef.current && appState.zoom.value < 1) 
            {
             console.log("🟠 Skipping due to zoom < 1");

              excaliRef.current.updateScene({
                appState: {
                  ...appState,
                  zoom: { value: 1 as NormalizedZoomValue },
                },
              });
            return; // Don't process this change
            }

            //Guard against duplicate calls
            
            if (
              generateDiff({elements, appState, files}, lastChangeRef.current) === undefined
            ) {
              // Skip duplicate calls
              console.log("🟤 Skipping duplicate onChange");

              return;
            }

            lastChangeRef.current = structuredClone({elements, appState, files});
            
            onSceneChange?.({
              elements: elements ?? ([] as readonly any[]),
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


/*
  const exportForBackend = useCallback(async () => {
    const blob = await getPNGBlob();
    if (!blob) return;
    const form = new FormData();
    form.append("file", blob, "sketch.png");
    await fetch("/api/generate/", { method: "POST", body: form });
  }, [getPNGBlob]);

  
  const exportPNGDownload = useCallback(async () => {
    const blob = await getPNGBlob();
    if (!blob) return;
    const dataUrl = await blobToDataURL(blob);
    onExportImage?.(dataUrl);

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sketch.png";
    a.click();
    URL.revokeObjectURL(url);
  }, [getPNGBlob, onExportImage]);


  const getPNGDataURL = useCallback(async () => {
    const blob = await getPNGBlob();
    if (!blob) return null;
    return await blobToDataURL(blob);
  }, [getPNGBlob]);
  */
  /*
  // MOST ROBUST: open a tab first, then navigate it to the blob URL
  const exportPNGInNewTab = useCallback(async () => {
    // Open early to avoid popup blockers
    const w = window.open("about:blank", "_blank", "noopener,noreferrer");
    if (!w) return;

    const blob = await getPNGBlob();
    if (!blob) {
      w.document.write("Nothing to export.");
      return;
    }

    const url = URL.createObjectURL(blob);
    try {
      // Navigate the new tab to the blob URL (browser shows image directly)
      w.location.href = url;
    } catch {
      // Fallback: inject an <img> if navigation was blocked for some reason
      w.document.body.style.margin = "0";
      const img = w.document.createElement("img");
      img.src = url;
      img.alt = "Sketch";
      img.style.display = "block";
      img.style.maxWidth = "100vw";
      img.style.maxHeight = "100vh";
      img.style.objectFit = "contain";
      w.document.body.appendChild(img);
    }
    // Clean up when the tab closes
    w.addEventListener("beforeunload", () => URL.revokeObjectURL(url));
  }, [getPNGBlob]);*/
