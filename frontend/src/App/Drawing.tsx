import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

export type DrawingHandle = {
  exportForBackend: () => Promise<void>;
  exportPNGDownload: () => Promise<void>;
  getPNGDataURL: () => Promise<string | null>;
  exportPNGInNewTab: () => Promise<void>; // open a tab and show PNG
};

export interface DrawingProps {
  onExportImage?: (pngDataUrl: string) => void;
  className?: string;
  width?: number;
  height?: number;
}

// Infer Excalidraw API type from prop (version-safe)
type ExcalidrawAPI = NonNullable<
  Parameters<
    NonNullable<React.ComponentProps<typeof Excalidraw>["excalidrawAPI"]>
  >[0]
>;

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onloadend = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

const Drawing = forwardRef<DrawingHandle, DrawingProps>(function Drawing(
  { onExportImage, className, width, height },
  ref
) {
  const excaliRef = useRef<ExcalidrawAPI | null>(null);

  const getPNGBlob = useCallback(async (): Promise<Blob | null> => {
    const api = excaliRef.current;
    if (!api) return null;

    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const files = api.getFiles?.() ?? {};

    // Built-in export with white background
    const blob = await exportToBlob({
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
    return blob;
  }, []);

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
  }, [getPNGBlob]);

  useImperativeHandle(ref, () => ({
    exportForBackend,
    exportPNGDownload,
    getPNGDataURL,
    exportPNGInNewTab,
  }));

  return (
    <div
      className={className}
      style={{
        width: width ?? "100%",
        height: height ?? "100%", // fill the area under navbar
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
