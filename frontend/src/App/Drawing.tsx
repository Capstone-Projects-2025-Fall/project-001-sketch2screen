import React, { forwardRef, useCallback, useImperativeHandle, useRef, useEffect} from "react";
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import type { NormalizedZoomValue } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";


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
const Drawing = forwardRef<DrawingHandle, DrawingProps>(function Drawing(
  { className, visible, initialScene, onSceneChange, onExcalidrawAPI },
  ref
) {
  /** Reference to Excalidraw's API methods */
  const excaliRef = useRef<ExcalidrawAPI | null>(null);

  /** Cache of last scene state to prevent duplicate updates */
  const lastSceneRefs = useRef<{
    elements: readonly any[] | null;
    appState: any | null;
    files: Record<string, any> | null;
  }>({ elements: null, appState: null, files: null });

  //flag to skip onChange right after initial load
  const skipNextOnChange = useRef(false);

  useEffect(() => {
    if (initialScene){
      skipNextOnChange.current = true;
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


  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getPNGBlob,
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
          initialScene
            ? {
                elements: initialScene.elements ?? [],
                appState: initialScene.appState ?? {},
                files: initialScene.files ?? {},
              }
            : undefined
        }
        onChange={(elements, appState, files) => {

            console.log("🟡 onChange fired", {
              skipNext: skipNextOnChange.current,
              elementsCount: elements?.length,
              hasElements: !!elements
            });

          if (skipNextOnChange.current) {
            console.log("🔴 Skipping due to skipNextOnChange");

            skipNextOnChange.current = false;
            lastSceneRefs.current = { elements, appState, files };
            return;
          }
          
          if (excaliRef.current && appState.zoom.value < 1) 
          {
           console.log("🟠 Skipping due to zoom < 1");

          //important to update lastSceneRefs to maintain duplicate detection
          lastSceneRefs.current = { elements, appState, files };
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
            lastSceneRefs.current.elements === elements &&
            lastSceneRefs.current.files === files
          ) {
            // Skip duplicate calls
            console.log("🟤 Skipping duplicate onChange");

            return;
          }

          // Only trigger onSceneChange if elements or files changed (actual drawing content)
          // Ignore appState changes (zoom, pan, tool selection, etc.)
          
          lastSceneRefs.current = { elements, appState, files };

          
          console.log("✅ Calling onSceneChange with elements:", elements?.length);

          onSceneChange?.({
            elements: elements ?? ([] as readonly any[]),
            appState: appState ?? {},
            files: files ?? {},
          });
          

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
});

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
