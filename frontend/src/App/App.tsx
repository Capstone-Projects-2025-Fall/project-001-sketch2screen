import styles from "./App.module.css";
import { useMemo, useRef, useState, useEffect } from "react";
import Navbar from "./Navbar";
import type { DrawingHandle, SceneData } from "./Drawing";
import Mockup from "./Mockup";
import type { MockupPage } from "./Mockup";
import Drawing from "./Drawing";
import PageSidebar from "./reusable_sidebar";
import { LoadingSpinner } from "./LoadingScreen";
import CollaborationDialog from "./CollaborationDialog";
import { useCollaboration } from "./useCollaboration";
import type { SketchPage } from "./sketchPage";


/** Represents the available pages/views in the application */
export enum Page {
  Drawing,
  Mockup
}

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
  const [initialCollabId] = useState(() => getCollabId());
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

  /** Controls whether the sidebar is expanded or collapsed */
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // ref for pointer event
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  
  // collaboration hook
  const {
    collabEnabled,
    showCollabDialog,
    collabId,
    sceneVersion,
    handleShowCollaboration,
    handleCloseCollabDialog,
    handleCollabSceneChange,
    notifyPageAdded,
    notifyPageDuplicated,
    notifyPageRenamed,
    notifyPageDeleted,
  } = useCollaboration({
    collabId: initialCollabId,
    pages,
    activePageId,
    activePageIdRef,
    setPages,
    setActivePageId,
    setEditingId,
    makeEmptyScene,
    canvasHostRef,
  });

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

  /** 
   * Updates the scene data for the active page
   * @param scene - New scene data from Excalidraw
   */
  const handleSceneChange = (scene: SceneData) => {
    setPages(prev => {
      const i = prev.findIndex(p => p.id === activePageId);
      if (i < 0) return prev;
      
      const oldScene = prev[i]?.scene;
      const next = [...prev];
      next[i] = { ...next[i], scene };

      //handle collaboration scene change
      handleCollabSceneChange(scene, oldScene);

      return next;
    });
  };

  // === PAGE MANAGEMENT ===
  /** Creates and activates a new blank page */
  const handleAddPage = () => {
    // Generate new page ID based on collab ID
    const pageNumber = pages.length + 1;
    const newPageId = collabEnabled ? `${collabId}-p${pageNumber}` : crypto.randomUUID();
    
    const newPage: SketchPage = {
      id: newPageId,
      name: `Page ${pageNumber}`,
      scene: makeEmptyScene(),
    };
    
    console.log("Adding new page:", newPageId);
    setPages(prev => [...prev, newPage]);
    setActivePageId(newPage.id);

    // Notify collaboration
    notifyPageAdded(newPage.id, newPage.name);
  };

  /** 
   * Creates a copy of the current page and activates it
   */
  const handleDuplicatePage = () => {
    if (!activeSketch) return;
    
    const dupeScene: SceneData = {
      elements: JSON.parse(JSON.stringify(activeSketch.scene.elements || [])),
      appState: makeEmptyScene().appState, // Use fresh appState instead of cloning
      files: JSON.parse(JSON.stringify(activeSketch.scene.files || {})),
    };
    
    const dupeID = collabEnabled
      ? `${collabId}-p${Date.now()}`
      : crypto.randomUUID();
      
    const dupe: SketchPage = {
      id: dupeID,
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

    // Notify collaboration of duplication
    notifyPageDuplicated(dupe.id, dupe.name, dupe.scene);
  };

  /** 
   * Updates the name of a specific page
   * @param id - ID of the page to rename
   * @param name - New name for the page
   */
  const handleRenamePage = (id: string, name: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, name } : p));

    // Notify collaboration name change
    notifyPageRenamed(id, name);
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

    // Notify collaboration of deletion
    notifyPageDeleted(id);
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
      setCurrentPage(Page.Mockup);
    }catch (error) {
      console.error("Generation error:", error);
      alert("An error occurred during generation");
    }finally {
      setLoading(false);
    }
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

        
        <div className={styles.main} ref={canvasHostRef}>
        {/* Only render the ACTIVE Drawing component */}
        {currentPage === Page.Drawing && activeSketch && (
          <Drawing 
            key={`${activeSketch?.id}-v${sceneVersion}`}
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
        onClose={handleCloseCollabDialog}
        collabId={collabId}
      />
    </div>
  );
}
