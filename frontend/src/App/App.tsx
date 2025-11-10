import styles from "./App.module.css";
import { useMemo, useRef, useState, useEffect } from "react";
import Navbar from "./Navbar";
import type { DrawingHandle, SceneData } from "./Drawing";
import Mockup from "./Mockup";
import type { MockupPage } from "./Mockup";
import Drawing from "./Drawing";
import PageSidebar from "./reusable_sidebar";
import { LoadingSpinner } from "./LoadingScreen";
import CollabClient from "./CollabClient";
import CollaborationDialog from "./CollaborationDialog";

/** Represents the available pages/views in the application */
export enum Page {
  Drawing,
  Mockup
}

/** Represents a single sketch page with its metadata and content */
type SketchPage = {
  /** Unique identifier for the page */
  id: string;
  /** Display name of the page */
  name: string;
  /** Excalidraw scene data containing elements, state and files */
  scene: SceneData;
};

/** 
 * Creates an empty Excalidraw scene with default settings
 * @returns A new SceneData object with default values
 */
export function makeEmptyScene(): SceneData {
  return {
    elements: [],
    appState: {
      viewBackgroundColor: "#ffffff",
      currentItemStrokeColor: "#000000",
      currentItemFillColor: "transparent",
      exportBackground: true,
      exportWithDarkMode: false,
    } as any,
    files: {},
  };
}

/** 
 * Creates a new sketch page with default settings
 * @param index - The page number to use in the default name
 * @returns A new SketchPage object
 */
export function makeNewSketchPage(index: number): SketchPage {
  return {
    id: crypto.randomUUID(),
    name: `Page ${index}`,
    scene: makeEmptyScene(),
  };
}

/** Gets collaboration ID from URL or generates new one */
function getCollabId(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('collab') || Date.now().toString();
}

/** Main application component managing the sketch interface */
export default function App() {
  // Compute a stable collab id up-front so we can also use it for the very first page id.
  const initialCollabId = getCollabId();

  /** Current active view (Drawing or Mockup) */
  const [currentPage, setCurrentPage] = useState(Page.Drawing);
  
  /** Collection of all sketch pages */
  // Make the **first page id deterministic** based on the collab id so both tabs share it.
  const [pages, setPages] = useState<SketchPage[]>(() => [{
    id: `${initialCollabId}-p1`,
    name: "Page 1",
    scene: makeEmptyScene(),
  }]);
  
  /** ID of the currently active sketch page */
  const [activePageId, setActivePageId] = useState<string>(() => `${initialCollabId}-p1`);

  // Keep a ref that always has the latest activePageId
  const activePageIdRef = useRef<string>(activePageId);
  
  // Update ref whenever activePageId changes
  useEffect(() => {
    activePageIdRef.current = activePageId;
  }, [activePageId]);

  /** Reference to access Drawing component methods */
  const drawingRef = useRef<DrawingHandle | null>(null);

  /** References to all Drawing components (one per page) */
  const drawingRefs = useRef<Record<string, DrawingHandle | null>>({});
  /** Generated HTML code from the backend */
  const [html, setHtml] = useState<string>("");

  /** Generated mockup pages */
  const [mockups, setMockups] = useState<MockupPage[]>([]);
  
  /** Loading state during backend processing */
  const [loading, setLoading] = useState(false);
  
  /** Current filename for the sketch */
  const [filename, setFilename] = useState<string>("");
  
  /** ID of the page currently being renamed, if any */
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Collaboration state
  const [showCollabDialog, setShowCollabDialog] = useState(false);
  const [collabEnabled, setCollabEnabled] = useState(false);
  const [collabId] = useState<string>(() => initialCollabId);
  const collabClientRef = useRef<CollabClient | null>(null);
  // Track if the local user is currently drawing to avoid mid-stroke remounts
  const isDrawingRef = useRef(false);
  const needsRemountRef = useRef(false);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const suppressRemoteUpdates = useRef(false);
  // Track pending scene data to send after stroke completes
  const pendingSceneRef = useRef<{ pageId: string; scene: SceneData } | null>(null);
  const [sceneVersion, setSceneVersion] = useState<number>(0);

  /** Controls whether the sidebar is expanded or collapsed */
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  /** Index of the active page in the pages array */
  const activeIndex = useMemo(
    () => pages.findIndex((p) => p.id === activePageId),
    [pages, activePageId]
  );

  /** Currently active sketch page */
  const activeSketch = pages[activeIndex] ?? pages[0];
  
  /** Refs to page DOM elements for scrolling */
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /** Scroll active page into view when it changes */
  useEffect(() => {
    const el = itemRefs.current[activePageId];
    if (el) {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activePageId, pages.length]);

  // Avoid remounts during a local stroke: detect pointer activity on the canvas host
  useEffect(() => {
    const host: EventTarget = canvasHostRef.current ?? document;
    const onDown = () => { isDrawingRef.current = true; };
    const end = () => {
      const wasDrawing = isDrawingRef.current;
      isDrawingRef.current = false;
      
      // Apply deferred remount if needed
      if (wasDrawing && needsRemountRef.current) {
        setSceneVersion((v: number) => v + 1);
        needsRemountRef.current = false;
      }
      
      // Send pending scene data after stroke completes
      if (wasDrawing && pendingSceneRef.current && collabEnabled && collabClientRef.current) {
        const { pageId, scene } = pendingSceneRef.current;
        console.log("Stroke complete - sending scene update:", pageId);
        collabClientRef.current.sendSceneUpdate(pageId, scene);
        pendingSceneRef.current = null;
      }
    };

    host.addEventListener('pointerdown', onDown as any, { passive: true } as any);
    host.addEventListener('pointerup', end as any, { passive: true } as any);
    host.addEventListener('pointercancel', end as any, { passive: true } as any);
    host.addEventListener('pointerleave', end as any, { passive: true } as any);

    return () => {
      host.removeEventListener('pointerdown', onDown as any);
      host.removeEventListener('pointerup', end as any);
      host.removeEventListener('pointercancel', end as any);
      host.removeEventListener('pointerleave', end as any);
    };
  }, [activePageId, collabEnabled]);

  // === COLLABORATION LOGIC ===
  useEffect(() => {
    if (!collabEnabled) return;

    console.log(" Starting collaboration with ID:", collabId);
    const client = new CollabClient(Number(collabId));
    collabClientRef.current = client;

    // Handle incoming page updates
    client.setPageUpdateHandler((sketchID: string, name: string | null) => {
      console.log(" Received page update:", sketchID, name);

      if (name === null) {
        // Delete page
        setPages(prev => {
          if (prev.length <= 1) return prev;
          return prev.filter(p => p.id !== sketchID);
        });
        return;
      }

      setPages(prev => {
        const existingIndex = prev.findIndex(p => p.id === sketchID);
        if (existingIndex >= 0) {
          // rename/update
          const next = [...prev];
          next[existingIndex] = { ...next[existingIndex], name };
          return next;
        }

        // If we only have one *empty default* page with a different id, REPLACE it.
        const onlyOne = prev.length === 1;
        const emptyDefault = onlyOne && ((prev[0].scene?.elements?.length ?? 0) === 0);
        const differentId = onlyOne && prev[0].id !== sketchID;
        if (emptyDefault && differentId) {
          console.log(" Replacing empty default page with collaborator page:", sketchID);
          // Only switch to received page on initial replacement
          setActivePageId(sketchID);
          return [{ id: sketchID, name: name ?? "Page 1", scene: prev[0].scene ?? makeEmptyScene() }];
        }

        console.log(" Adding page from collaborator:", sketchID, "- NOT switching to it");
        // Add new page but DON'T switch to it
        return [...prev, { id: sketchID, name: name ?? "Page 1", scene: makeEmptyScene() }];
      });
    });

    // Handle incoming scene updates
    client.setSceneUpdateHandler((sketchID: string, sceneData: SceneData) => {
      const currentActivePageId = activePageIdRef.current;
      console.log("Received scene update for:", sketchID, "Current active:", currentActivePageId);
      suppressRemoteUpdates.current = true;

      setPages(prev => {
        const index = prev.findIndex(p => p.id === sketchID);
        if (index === -1) {
          console.warn(" Page not found:", sketchID);
          return prev;
        }
        const next = [...prev];
        
        next[index] = {
          ...next[index],
          scene: {
            elements: sceneData.elements,
            appState: prev[index].scene.appState,
            files: sceneData.files,
          },
        };
        return next;
      });

      // If this update is for the currently active page, force remount
      console.log("Checking remount:", sketchID, "===", currentActivePageId, "?", sketchID === currentActivePageId);
      if (sketchID === currentActivePageId) {
        if (isDrawingRef.current) {
          console.log("Deferring remount until stroke end");
          needsRemountRef.current = true;
        } else {
          console.log(" Forcing remount for active page");
          setSceneVersion((v: number) => v + 1);
        }
      } else {
        console.log("Update for different page - will show when switched");
      }

      // Reset flag after update processes
      setTimeout(() => {
        suppressRemoteUpdates.current = false;
      }, 50);
    });

    // When WebSocket opens, send ONLY the active page once
    client.connection.onopen = () => {
      console.log(" WebSocket connected");
      setTimeout(() => {
        const active = pages.find(p => p.id === activePageIdRef.current) ?? pages[0];
        client.sendPageUpdate(active.id, active.name);
        if ((active.scene?.elements?.length ?? 0) > 0) {
          client.sendSceneUpdate(active.id, active.scene);
        }
      }, 300);
    };

    client.connection.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      console.log("Disconnecting WebSocket");
      if (client.connection.readyState === WebSocket.OPEN) {
        client.connection.close();
      }
    };
  // We intentionally avoid depending on pages/activePageId to keep handlers stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collabEnabled, collabId]);

  /** 
   * Updates the scene data for the active page
   * @param scene - New scene data from Excalidraw
   */
  const handleSceneChange = (scene: SceneData) => {
    setPages(prev => {
      const i = prev.findIndex(p => p.id === activePageId);
      if (i < 0) return prev;

      const next = [...prev];
      next[i] = { ...next[i], scene };

      // Send to collaborators
      if (collabEnabled && collabClientRef.current && !suppressRemoteUpdates.current) 
      {
        const sceneToSend = {...scene, appState: null};
        
        if (isDrawingRef.current) {
          // User is currently drawing - store the scene to send after stroke completes
          pendingSceneRef.current = { pageId: activePageId, scene: sceneToSend };
        } else {
          // User is not drawing - send immediately (e.g., undo, paste, etc.)
          console.log("Sending scene update immediately:", activePageId);
          collabClientRef.current.sendSceneUpdate(activePageId, sceneToSend);
        }
      }

      return next;
    });
  };

  // === PAGE MANAGEMENT ===
  /** Creates and activates a new blank page */
  const handleAddPage = () => {
    const newPage = makeNewSketchPage(pages.length + 1);
    setPages(prev => [...prev, newPage]);
    setActivePageId(newPage.id);

    if (collabEnabled && collabClientRef.current) {
      collabClientRef.current.sendPageUpdate(newPage.id, newPage.name);
    }
  };

  /** 
   * Creates a copy of the current page and activates it
   */
  const handleDuplicatePage = () => {
    if (!activeSketch)
       return;
    
    const dupeScene: SceneData = {
    elements: JSON.parse(JSON.stringify(activeSketch.scene.elements || [])),
    appState: makeEmptyScene().appState, // Use fresh appState instead of cloning
    files: JSON.parse(JSON.stringify(activeSketch.scene.files || {})),
    };
    
    const dupe: SketchPage = {
      id: crypto.randomUUID(),
      name: `${activeSketch.name} (copy)`,
      scene: dupeScene,
    };

    setPages(prev => {
      const next = [...prev];
      const i = next.findIndex(p => p.id === activePageId);
      next.splice(Math.max(0, i) + 1, 0, dupe);
      return next;
    });
    setActivePageId(dupe.id);

    if (collabEnabled && collabClientRef.current) {
      collabClientRef.current.sendPageUpdate(dupe.id, dupe.name);
      collabClientRef.current.sendSceneUpdate(dupe.id, dupe.scene);
    }
  };

  /** 
   * Updates the name of a specific page
   * @param id - ID of the page to rename
   * @param name - New name for the page
   */
  const handleRenamePage = (id: string, name: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, name } : p));

    if (collabEnabled && collabClientRef.current) {
      collabClientRef.current.sendPageUpdate(id, name);
    }
  };

  /** 
   * Removes a page and updates active page if necessary
   * @param id - ID of the page to delete
   */
  const handleDeletePage = (id: string) => {
    setPages(prev => {
      if (prev.length <= 1) return prev;
      const i = prev.findIndex(p => p.id === id);
      const next = prev.filter(p => p.id !== id);
      const newActive = next[Math.max(0, i - 1)];
      setActivePageId(newActive.id);
      if (editingId === id) setEditingId(null);
      return next;
    });

    if (collabEnabled && collabClientRef.current) {
      collabClientRef.current.sendPageUpdate(id, null);
    }
  };


  /** 
   * Generates HTML from current sketch via backend API
   * Exports current drawing as PNG and sends to backend
   */
  const handleGenerate = async () => {

    setLoading(true);
    
    try {

      const { exportToBlob } = await import("@excalidraw/excalidraw");
      // Collect all page blobs
      const pageBlobs: Array<{ id: string; name: string; blob: Blob }> = [];
      
      for (const page of pages) {
      // Skip pages with no elements
        if (!page.scene.elements || page.scene.elements.length === 0) {
          console.log(`Skipping empty page: ${page.name}`);
          continue;
        }
        
        // Export directly from scene data instead of using refs
        const blob = await exportToBlob({
          elements: page.scene.elements,
          appState: {
            ...page.scene.appState,
            exportBackground: true,
            exportWithDarkMode: false,
          },
          files: page.scene.files || {},
          mimeType: "image/png",
          quality: 1,
          backgroundColor: "white",
        });
        
        if (blob) {
          pageBlobs.push({ id: page.id, name: page.name, blob });
        }
      }

      if (pageBlobs.length === 0) {
        alert("No sketches to export. Please create at least one sketch.");
        return;
      }

      // Create form data with all images
      const formData = new FormData();
      pageBlobs.forEach((item, index) => {
        formData.append(`file_${index}`, item.blob, `${item.name}.png`);
        formData.append(`name_${index}`, item.name);
        formData.append(`id_${index}`, item.id);
      });
      formData.append('count', pageBlobs.length.toString());

      const res = await fetch("/api/generate-multi/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        alert("Failed to generate HTML from sketches");
        return;
      }

      // Expect array of HTML strings
      const data = (await res.json()) as { results: Array<{ id: string; html: string }> };
      
      if (!data.results || data.results.length === 0) {
        alert("No HTML received from server");
        return;
      }

      // Build mockup pages
      const newMockups: MockupPage[] = data.results.map((result) => {
        const page = pages.find((p) => p.id === result.id);
        return {
          id: result.id,
          name: page?.name || `Sketch Generated ${result.id}`,
          html: result.html,
        };
      });

      setMockups(newMockups);
      if(newMockups.length > 0) 
      {
        setActivePageId(newMockups[0].id);
      }
      setCurrentPage(Page.Mockup);
    }

    catch (error) {
      console.error("Generation error:", error);
      alert("An error occurred during generation");
    } 

    finally {
      setLoading(false);
    }
  };

  const handleShowCollaboration = () => {
    setCollabEnabled(true);
    setShowCollabDialog(true);
  };

  /** 
 * Exports the currently visible mockup as an HTML file 
 */
const handleExport = () => {
  if (mockups.length === 0) {
    alert("No mockups available to export. Please generate first.");
    return;
  }

  // Get currently active mockup
  const activeMockupIndex = mockups.findIndex((m) => m.id === activePageId);
  const activeMockup = activeMockupIndex >= 0 ? mockups[activeMockupIndex] : mockups[0];

  const blob = new Blob([activeMockup.html], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${activeMockup.name || "mockup"}.html`;
  link.click();
  URL.revokeObjectURL(link.href);
};


  return (
    <div className={styles.appRoot}>
      <Navbar
        curPage={currentPage}
        onPageChange={setCurrentPage}
        onGenerate={handleGenerate}
        onExport = {handleExport}
        filename={filename}
        onFilenameChange={setFilename}
        onStartCollab={handleShowCollaboration}
      />

      <div className={`${currentPage === Page.Drawing ? styles.workRow : styles.workRowNoSidebar} ${!sidebarExpanded && currentPage === Page.Drawing ? styles.workRowCollapsed : ''}`}>
        {/* sidebar toggle button - outside sidebar so it stays visible*/}
        {currentPage === Page.Drawing && (
            <PageSidebar<SketchPage>
            title="Pages"
            items={pages}
            activeItemId={activePageId}
            onSelectItem={setActivePageId}
            onRenameItem={handleRenamePage}
            onDeleteItem={handleDeletePage}
            onAddItem={handleAddPage}
            onDuplicateItem={handleDuplicatePage}
            editingId={editingId}
            onSetEditingId={setEditingId}
            expanded={sidebarExpanded}
            onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
          />
        )}

        
        <div className={styles.main}>
        {/* Only render the ACTIVE Drawing component */}
        {currentPage === Page.Drawing && activeSketch && (
          <Drawing 
            key={activePageId}
            ref={(ref) => { drawingRefs.current[activePageId] = ref; }} 
            className={styles.canvas} 
            visible={true}
            initialScene={activeSketch.scene}
            onSceneChange={handleSceneChange}
          />
        )}
        </div>

      
        {/*Mockup view*/}
        {currentPage === Page.Mockup && <Mockup mockups={mockups} activePageId={activePageId} onSelectPage={setActivePageId} />}

        {/* Loading overlay */}
        {loading && (
          <div style={{position: "absolute", inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 200}}>
            <LoadingSpinner />
            <p style={{ marginLeft: '1rem' }}>Generating {pages.length} page{pages.length > 1 ? 's' : ''}...</p>
          </div>
        )}
      </div>

      <CollaborationDialog
        isOpen={showCollabDialog}
        onClose={() => setShowCollabDialog(false)}
        collabId={collabId}
      />
    </div>
  );
}
