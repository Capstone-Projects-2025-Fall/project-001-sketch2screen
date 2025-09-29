import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

//With this type App.tsx can request the current sketch as a PNG Blob.
export type DrawingHandle = {
  getPNGBlob: () => Promise<Blob | null>;
};

//Props that can be passed into <Drawing />
export interface DrawingProps {
  className?: string;
  width?: number;
  height?: number;
  visible?: boolean;
}

//Object that gives us access to Excalidraw's API methods.
type ExcalidrawAPI = NonNullable<
  Parameters<
    NonNullable<React.ComponentProps<typeof Excalidraw>["excalidrawAPI"]>
  >[0]
>;

//Component implementation


const Drawing = forwardRef<DrawingHandle, DrawingProps>(function Drawing(
  { className, visible },
  ref
) {
  //Reference to ExcalidrawAPI
  const excaliRef = useRef<ExcalidrawAPI | null>(null);

  //Exports the current sketch as a PNG Blob.
  //Helper function
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

