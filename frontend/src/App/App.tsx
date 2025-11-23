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
import { exportToBlob } from "@excalidraw/excalidraw";


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
      collaborators: [],
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

/**
 * Serializes a scene for comparison purposes
 * Only includes elements and files (the actual drawing content)
 */
function serializeScene(scene: SceneData): string {
  return JSON.stringify({
    elements: scene.elements,
    files: scene.files
  });
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
  
  /** Track the scene state at the time each page was last generated */
  const [lastGeneratedScenes, setLastGeneratedScenes] = useState<Record<string, string>>({});
  
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
  
  /** Index of the active page in the pages array */
  const activeIndex = useMemo(
    () => pages.findIndex((p) => p.id === activePageId),
    [pages, activePageId]
  );

  // collaboration hook
  const {
    collabEnabled,
    showCollabDialog,
    needsUsername,  // NEW
    collabId,
    sceneVersion,
    collaborators,  // NEW
    handleShowCollaboration,
    handleCloseCollabDialog,
    handleConfirmUsername,  // NEW
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
    drawingRef: drawingRefs,  // Pass the refs object
  });

  // Check for collab URL parameter on mount - show dialog but do not auto-enable
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const collabParam = params.get('collab');
    
    if (collabParam && !collabEnabled) {
      // Just show the dialog - username entry will enable collaboration
      handleShowCollaboration();
    }
  }, []); // Only run once on mount


  /** Currently active sketch page */
  const activeSketch = pages[activeIndex] ?? pages[0];
  
  /** Refs to page DOM elements for scrolling */
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  //use excalidraw api instead of keying for remounts
  useEffect(() => {
    setTimeout(() => drawingRefs.current?.[activePageId]?.updateScene(activeSketch.scene), 0)
  }, [sceneVersion, activeSketch, activePageId])

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

    console.log("🔵 App.handleSceneChange called", {
      activePageId,
      elementsCount: scene.elements?.length,
      pagesCount: pages.length
    });

    setPages(prev => {
      const i = prev.findIndex(p => p.id === activePageId);
      console.log("🔵 Found page at index:", i, "ID:", activePageId);

      if (i < 0) return prev;
      
      const oldScene = prev[i].scene
      const next = [...prev];
      next[i] = { ...next[i], scene };

      console.log("🔵 Updated page scene", {
        pageId: next[i].id,
        newElementsCount: scene.elements?.length
      });

      handleCollabSceneChange(scene);

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
   * Creates a duplicate of the specified page
   * @param id - ID of the page to duplicate
   */
  const handleDuplicatePage = (id: string) => {
    const pageIndex = pages.findIndex((p) => p.id === id);
    if (pageIndex < 0) return;

    const pageToDuplicate = pages[pageIndex];
    
    // Generate new ID for duplicated page
    const newPageId = collabEnabled ? `${collabId}-p${Date.now()}` : crypto.randomUUID();
    
    const newPage: SketchPage = {
      id: newPageId,
      name: `${pageToDuplicate.name} Copy`,
      scene: structuredClone(pageToDuplicate.scene),
    };

    setPages((prev) => {
      const next = [...prev];
      next.splice(pageIndex + 1, 0, newPage);
      return next;
    });

    setActivePageId(newPage.id);
    
    // Notify collaboration
    notifyPageDuplicated(newPage.id, newPage.name, newPage.scene);
  };

  /** Wrapper for duplicate handler that works with PageSidebar's signature */
  const handleDuplicateActivePage = () => {
    handleDuplicatePage(activePageId);
  };

  /** 
   * Renames a page
   * @param id - ID of the page to rename
   * @param newName - New name for the page
   */
  const handleRenamePage = (id: string, newName: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
    setEditingId(null);
    
    // Notify collaboration
    notifyPageRenamed(id, newName);
  };

  /** 
   * Removes a page and updates active page if necessary
   * @param id - ID of the page to delete
   */
  const handleDeletePage = (id: string) => {
    if (pages.length === 1) return;

    const pageIndex = pages.findIndex((p) => p.id === id);
    if (pageIndex < 0) return;

    setPages((prev) => prev.filter((p) => p.id !== id));

    if (activePageId === id) {
      const nextIndex = Math.min(pageIndex, pages.length - 2);
      setActivePageId(pages[nextIndex].id);
    }
    
    // Notify collaboration of deletion
    notifyPageDeleted(id);
  };

  /** 
   * Generates HTML from current sketch via backend API
   * Only regenerates pages that have changed since last generation
   */
  const handleGenerate = async () => {
    try {
      setLoading(true);

      // Collect all page blobs
      // Identify pages that need regeneration
      const pagesToGenerate: SketchPage[] = [];
      const unchangedPages: SketchPage[] = [];
      
      for (const page of pages) {
        // Skip pages with no elements
        if (!page.scene.elements || page.scene.elements.length === 0) {
          console.log(`Skipping empty page "${page.name}"`);
          continue;
        }
        
        // Serialize current scene
        const currentSceneSerialized = serializeScene(page.scene);
        const lastGeneratedScene = lastGeneratedScenes[page.id];
        
        // Check if page needs regeneration
        if (!lastGeneratedScene || currentSceneSerialized !== lastGeneratedScene) {
          // Page is new or has changed - needs regeneration
          pagesToGenerate.push(page);
          console.log(`Page "${page.name}" needs regeneration (${!lastGeneratedScene ? 'new' : 'changed'})`);
        } else {
          // Page unchanged - can reuse existing mockup
          unchangedPages.push(page);
          console.log(`Page "${page.name}" unchanged - reusing cached mockup`);
        }
      }
      
      if (pagesToGenerate.length === 0 && unchangedPages.length === 0) {
        alert("No sketches to export. Please create at least one sketch.");
        return;
      }
      
      // Collect blobs for pages that need regeneration
      const pageBlobs: Array<{ id: string; name: string; blob: Blob }> = [];
      
      for (const page of pagesToGenerate) {
        // Export directly from scene data
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

      let newGeneratedMockups: MockupPage[] = [];
      
      // Only call backend if there are pages to regenerate
      if (pageBlobs.length > 0) {
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

        // Build mockup pages for newly generated content
        // Match by index since backend might not preserve our IDs
        newGeneratedMockups = data.results.map((result, index) => {
          // Try to match by backend's returned ID first
          let page = pages.find((p) => p.id === result.id);
          
          // If not found, match by index (order in which we sent pages)
          if (!page && index < pageBlobs.length) {
            const sentPageId = pageBlobs[index].id;
            page = pages.find((p) => p.id === sentPageId);
          }
          
          // Use the page ID we sent, not the backend's ID
          const pageId = page?.id || result.id;
          
          return {
            id: pageId, // Use our page ID, not backend's
            name: page?.name || `Sketch Generated ${index + 1}`,
            html: result.html,
          };
        });
        
        // Update lastGeneratedScenes for newly generated pages
        setLastGeneratedScenes(prev => {
          const next = { ...prev };
          for (const page of pagesToGenerate) {
            next[page.id] = serializeScene(page.scene);
          }
          return next;
        });
      }
      
      // Combine new mockups with reused mockups (maintaining order)
      const finalMockups: MockupPage[] = pages
        .filter(page => page.scene.elements && page.scene.elements.length > 0)
        .map(page => {
          // Check if this page was newly generated
          const newMockup = newGeneratedMockups.find(m => m.id === page.id);
          if (newMockup) {
            return newMockup;
          }
          
          // Otherwise, reuse existing mockup
          const existingMockup = mockups.find(m => m.id === page.id);
          if (existingMockup) {
            return existingMockup;
          }
          
          // This shouldn't happen, but return null to filter out
          return null;
        })
        .filter((m): m is MockupPage => m !== null); // Filter out any null entries
      
      setMockups(finalMockups);
      setCurrentPage(Page.Mockup);
      
      // Show summary of what was done
      if (pageBlobs.length > 0) {
        console.log(`Generated ${pageBlobs.length} new mockup(s), reused ${unchangedPages.length} cached mockup(s)`);
      } else {
        console.log(`All ${unchangedPages.length} mockup(s) were cached - no regeneration needed`);
      }
      
    } catch (error) {
      console.error("Generation error:", error);
      alert("An error occurred during generation");
    } finally {
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
            onDuplicateItem={handleDuplicateActivePage}
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
            key={`${activeSketch?.id}`}
            ref={(ref) => { drawingRefs.current[activePageId] = ref; }} 
            className={styles.canvas} 
            visible={true}
            initialScene={{
              ...activeSketch.scene,
              appState: {
                ...activeSketch.scene.appState,
                collaborators: collaborators,  // Pass collaborators to Excalidraw
              },
            }}
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
            <p style={{ marginLeft: '1rem' }}>Generating {pages.filter(p => p.scene.elements?.length > 0).length} page{pages.filter(p => p.scene.elements?.length > 0).length > 1 ? 's' : ''}...</p>
          </div>
        )}
      </div>

      <CollaborationDialog
        isOpen={showCollabDialog}
        onClose={handleCloseCollabDialog}
        collabId={collabId}
        onConfirm={handleConfirmUsername}  // Pass username confirmation handler
        needsUsername={needsUsername}      // Indicate if username is needed
      />
    </div>
  );
}