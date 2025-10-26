import styles from "./App.module.css";
import { useMemo, useRef, useState, useEffect } from "react";
import Navbar from "./Navbar";
import type { DrawingHandle, SceneData } from "./Drawing";
import Mockup, { MockupPage } from "./Mockup";
import Drawing from "./Drawing";
import PageSidebar from "./reusable_sidebar";
import { LoadingSpinner } from "./LoadingScreen";

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

/** Main application component managing the sketch interface */
export default function App() {
  /** Current active view (Drawing or Mockup) */
  const [currentPage, setCurrentPage] = useState(Page.Drawing);
  
  /** Collection of all sketch pages */
  const [pages, setPages] = useState<SketchPage[]>(() => [makeNewSketchPage(1)]);
  
  /** ID of the currently active sketch page */
  const [activePageId, setActivePageId] = useState<string>(() => pages[0].id);
  
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

  /** Index of the active page in the pages array */
  const activeIndex = useMemo(
    () => pages.findIndex((p) => p.id === activePageId),
    [pages, activePageId]
  );

  /** Currently active sketch page */
  const activeSketch = pages[activeIndex] ?? pages[0];

  /** 
   * Updates the scene data for the active page
   * @param scene - New scene data from Excalidraw
   */
  const handleSceneChange = (scene: SceneData) => {
    setPages((prev) => {
      const i = prev.findIndex((p) => p.id === activePageId);
      if (i < 0) return prev;

      const cur = prev[i].scene;

      if (
        cur.elements === scene.elements &&
        cur.appState === scene.appState &&
        cur.files === scene.files
      ) {
        return prev;
      }

      const next = [...prev];
      next[i] = { ...prev[i], scene };
      return next
    });
  };

  /** Creates and activates a new blank page */
  const handleAddPage = () => {
    const newPage = makeNewSketchPage(pages.length + 1);
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
  };

  /** 
   * Creates a copy of the current page and activates it
   */
  const handleDuplicatePage = () => {
    if (!activeSketch) return;

    const dupeScene: SceneData =
      typeof structuredClone === "function"
        ? structuredClone(activeSketch.scene)
        : JSON.parse(JSON.stringify(activeSketch.scene));

    const dupe: SketchPage = {
      id: crypto.randomUUID(),
      name: `${activeSketch.name} (copy)`,
      scene: dupeScene,
    };

    setPages((prev) => {
      const next = [...prev];
      const i = next.findIndex((p) => p.id === activePageId);
      next.splice(Math.max(0, i) + 1, 0, dupe);
      return next;
    });

    setActivePageId(dupe.id);    
  };

  /** 
   * Updates the name of a specific page
   * @param id - ID of the page to rename
   * @param name - New name for the page
   */
  const handleRenamePage = (id: string, name: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  /** 
   * Removes a page and updates active page if necessary
   * @param id - ID of the page to delete
   */
  const handleDeletePage = (id: string) => {
    setPages((prev) => {
      if (prev.length <= 1) return prev; // must keep one
      const i = prev.findIndex((p) => p.id === id);
      const next = prev.filter((p) => p.id !== id);
      // pick a neighbor to become active
      const newActive = next[Math.max(0, i - 1)];
      setActivePageId(newActive.id);
      if (editingId === id) setEditingId(null);
      return next;
    });
  };

  /** 
   * Generates HTML from current sketch via backend API
   * Exports current drawing as PNG and sends to backend
   */
  const handleGenerate = async () => {
    setLoading(true);
    
    try {
      // Collect all page blobs
      const pageBlobs: Array<{ id: string; name: string; blob: Blob }> = [];
      
      for (const page of pages) {
        // Get the drawing ref for this page
        const drawingRef = drawingRefs.current[page.id];
        const blob = await drawingRef?.getPNGBlob?.();
        
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
          name: page?.name || "Untitled",
          html: result.html,
        };
      });

      setMockups(newMockups);
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

  return (
    <div className={styles.appRoot}>
      <Navbar
        curPage={currentPage}
        onPageChange={setCurrentPage}
        onGenerate={handleGenerate}
        filename={filename}
        onFilenameChange={setFilename}
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
        {/* Render all Drawing components (hidden when not active) */}
        {pages.map((page) => (
        <Drawing 
          key={page.id}
          ref={(ref) => { drawingRefs.current[page.id] = ref; }} 
          className={styles.canvas} 
          visible={currentPage === Page.Drawing && page.id === activePageId}
          initialScene={page.scene}
          onSceneChange={page.id === activePageId ? handleSceneChange : undefined}
        />
        ))}

        {/*Mockup view*/}
        {currentPage === Page.Mockup && <Mockup mockups={mockups} />}

        {/* Loading overlay */}

        {/* Loading overlay */}
        {loading && (
          <div style={{position: "absolute", inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 200}}>
            <LoadingSpinner />
            <p style={{ marginLeft: '1rem' }}>Generating {pages.length} page{pages.length > 1 ? 's' : ''}...</p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
