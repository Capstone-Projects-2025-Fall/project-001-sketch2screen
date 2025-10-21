import styles from "./App.module.css";
import { useMemo, useRef, useState, useEffect } from "react";
import Navbar from "./Navbar";
import type { DrawingHandle, SceneData } from "./Drawing";
import Mockup from "./Mockup";
import Drawing from "./Drawing";
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
      currentItemOpacity: 100,
      currentItemRoughness: 1,
      currentItemStrokeWidth: 1,
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

/**
 * Gets or creates a collaboration ID from URL or generates a new one
 * @returns Collaboration ID string
 */
function getCollabId(): string {
  const params = new URLSearchParams(window.location.search);
  const collabParam = params.get('collab');
  
  if (collabParam) {
    // Use existing collab ID from URL
    return collabParam;
  }
  
  // Check if we have a stored collab ID for this session
  const stored = sessionStorage.getItem('collabId');
  if (stored) {
    return stored;
  }
  
  // Generate new collab ID
  const newId = Date.now().toString();
  sessionStorage.setItem('collabId', newId);
  return newId;
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

  /** Generated HTML code from the backend */
  const [html, setHtml] = useState<string>("");
  
  /** Loading state during backend processing */
  const [loading, setLoading] = useState(false);

  /** Current filename for the sketch */
  const [filename, setFilename] = useState<string>("");

  /** ID of the page currently being renamed, if any */
  const [editingId, setEditingId] = useState<string | null>(null);

  /** Collaboration dialog visibility */
  const [showCollabDialog, setShowCollabDialog] = useState(false);

  /** Collaboration ID for this session */
  const [collabId] = useState<string>(() => getCollabId());

  /** Collaboration client reference */
  const collabClientRef = useRef<CollabClient | null>(null);

  /** Flag to prevent echo of own updates */
  const isLocalUpdate = useRef(false);

  /** Index of the active page in the pages array */
  const activeIndex = useMemo(
    () => pages.findIndex((p) => p.id === activePageId),
    [pages, activePageId]
  );

  /** Currently active sketch page */
  const activeSketch = pages[activeIndex] ?? pages[0];

  /** Refs to page DOM elements for scrolling */
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /** Initialize collaboration client */
  useEffect(() => {
    const client = new CollabClient(Number(collabId));
    collabClientRef.current = client;

    // Track if we've received initial data
    const receivedPages = new Set<string>();

    // Handle incoming page updates from collaborators FIRST
    client.setPageUpdateHandler((sketchID: string, name: string | null) => {
      console.log("Received page update:", sketchID, name);
      receivedPages.add(sketchID);
      isLocalUpdate.current = false;

      if (name === null) {
        // Page deleted
        console.log("Deleting page:", sketchID);
        receivedPages.delete(sketchID);
        setPages((prev) => {
          if (prev.length <= 1) return prev;
          const next = prev.filter((p) => p.id !== sketchID);
          
          // Update active page if deleted page was active
          if (activePageId === sketchID) {
            const newActive = next[0];
            setActivePageId(newActive.id);
          }
          
          return next;
        });
      } else {
        // Page created or renamed
        setPages((prev) => {
          const exists = prev.find((p) => p.id === sketchID);
          
          if (exists) {
            // Update name only
            console.log("Renaming page:", sketchID, "to", name);
            return prev.map((p) => 
              p.id === sketchID ? { ...p, name } : p
            );
          } else {
            // Create new page
            console.log("Adding new page from collaborator:", sketchID, name);
            
            // If this is the first page received and we only have default page, replace it
            if (prev.length === 1 && prev[0].name === "Page 1" && prev[0].scene.elements.length === 0) {
              console.log("Replacing default page with received page");
              setActivePageId(sketchID); // Update active page ID to the new one
              return [{
                id: sketchID,
                name,
                scene: makeEmptyScene(),
              }];
            }
            
            // Otherwise add as new page
            return [...prev, {
              id: sketchID,
              name,
              scene: makeEmptyScene(),
            }];
          }
        });
      }
    });

    // Handle incoming scene updates from collaborators
    client.setSceneUpdateHandler((sketchID: string, sceneData: SceneData) => {
      console.log("Received scene update for page:", sketchID);
      
      if (!sceneData || !sceneData.elements) {
        console.warn("Received invalid sceneData");
        return;
      }
      
      // Ensure sceneData has all required fields with proper defaults
      // IMPORTANT: collaborators must be a Map for Excalidraw to work
      const fullSceneData: SceneData = {
        elements: Array.isArray(sceneData.elements) ? sceneData.elements : [],
        appState: {
          viewBackgroundColor: "#ffffff",
          currentItemStrokeColor: "#000000",
          currentItemFillColor: "transparent",
          exportBackground: true,
          exportWithDarkMode: false,
          currentItemOpacity: 100,
          currentItemRoughness: 1,
          currentItemStrokeWidth: 1,
          ...(sceneData.appState || {}),
          collaborators: new Map(), // Always create a new Map for collaborators
        } as any,
        files: sceneData.files || {},
      };
      
      isLocalUpdate.current = false;
      
      setPages((prev) => {
        const index = prev.findIndex((p) => p.id === sketchID);
        if (index === -1) {
          console.warn("Received scene for unknown page:", sketchID, "- page will be created when page update arrives");
          return prev;
        }
        
        const next = [...prev];
        next[index] = { ...next[index], scene: fullSceneData };
        console.log("Updated page scene:", sketchID);
        return next;
      });
    });

    // Wait for WebSocket to open
    client.connection.onopen = () => {
      console.log("WebSocket connected");
      
      // Wait to see if we receive any pages from collaborators
      setTimeout(() => {
        if (receivedPages.size === 0) {
          console.log("No pages received, sending our pages to collaboration");
          // Only send our pages if no one else has pages
          pages.forEach((page) => {
            client.sendPageUpdate(page.id, page.name);
            setTimeout(() => {
              if (page.scene.elements.length > 0) {
                client.sendSceneUpdate(page.id, page.scene);
              }
            }, 100);
          });
        } else {
          console.log("Received pages from collaborators:", receivedPages.size);
        }
      }, 1000);
    };

    return () => {
      console.log("Cleaning up WebSocket connection");
      if (client.connection.readyState === WebSocket.OPEN) {
        client.connection.close();
      }
    };
  }, [collabId]);

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
    console.log("Scene change detected for page:", activePageId);
    
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

      // Send update to collaborators only if this is a local change
      if (collabClientRef.current && isLocalUpdate.current !== false) {
        console.log("Sending scene update to collaborators for page:", activePageId);
        // Ensure the page is registered first
        collabClientRef.current.sendPageUpdate(activePageId, next[i].name);
        // Then send the scene
        setTimeout(() => {
          collabClientRef.current?.sendSceneUpdate(activePageId, scene);
        }, 10);
      }
      isLocalUpdate.current = true;

      return next;
    });
  };

  /** Creates and activates a new blank page */
  const handleAddPage = () => {
    const newPage = makeNewSketchPage(pages.length + 1);
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);

    // Notify collaborators - send page FIRST, then scene
    if (collabClientRef.current) {
      collabClientRef.current.sendPageUpdate(newPage.id, newPage.name);
      // Give backend time to register the page before sending scene
      setTimeout(() => {
        collabClientRef.current?.sendSceneUpdate(newPage.id, newPage.scene);
      }, 50);
    }
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

    // Notify collaborators
    if (collabClientRef.current) {
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
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));

    // Notify collaborators
    if (collabClientRef.current) {
      collabClientRef.current.sendPageUpdate(id, name);
    }
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

      // Notify collaborators
      if (collabClientRef.current) {
        collabClientRef.current.sendPageUpdate(id, null);
      }

      return next;
    });
  };

  /** 
   * Generates HTML from current sketch via backend API
   * Exports current drawing as PNG and sends to backend
   */
  const handleGenerate = async () => {
    const blob = await drawingRef.current?.getPNGBlob?.();
    if (!blob) {
      alert("Please create a sketch first. No sketch to export");
      return;
    }
    //form data to send to backend
    const sketch = new FormData();
    sketch.append("file", new File([blob], "sketch.png", { type: "image/png" }));

    setLoading(true);
    try {
      const res = await fetch("/api/generate/", {
        method: "POST",
        body: sketch,
      });

      if (!res.ok) {
        alert("Failed to generate HTML from sketch");
        return;
      }

      //Export JSON back from the server
      const data = (await res.json()) as {html?: string};
      const htmlStr = (data.html ?? "").trim();
      if (!htmlStr) {
        alert("No HTML received from server");
        return;
      }
      //Save HTML
      setHtml(htmlStr);

      //Here you can set the current page to Mockup if you want to switch automatically
      setCurrentPage(Page.Mockup); 
    } finally {
      setLoading(false);
    }
  };

  /** Opens the collaboration dialog */
  const handleShowCollaboration = () => {
    setShowCollabDialog(true);
  };

  return (
    <div className={styles.appRoot}>
      <Navbar
        curPage={currentPage}
        onPageChange={setCurrentPage}
        onGenerate={handleGenerate}
        filename={filename}
        onFilenameChange={setFilename}
        onStartCollab={handleShowCollaboration}
      />

      <div className={currentPage === Page.Drawing ? styles.workRow : styles.workRowNoSidebar}>
        {/* sidebar */}
        {currentPage === Page.Drawing && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>Pages</div>

            <div className={styles.pageList}>
              {pages.map((p) => {
                const selected = p.id === activePageId;
                const isEditing = editingId === p.id;

                return (
                  <div
                    key={p.id}
                    ref={(node) => { itemRefs.current[p.id] = node; }}

                    className={
                      styles.pageItem + " " + (selected ? styles.pageItemSelected : "")
                    }
                    onClick={() => {
                      setActivePageId(p.id);
                      setEditingId(null);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingId(p.id);
                    }}
                    title={p.name}
                  >
                    <div className={styles.pageItemLabel}>
                      {/* tiny page icon (pure CSS) */}
                      <span className={styles.pageIcon} aria-hidden />
                      {isEditing ? (
                        <input
                          className={styles.pageNameInput}
                          autoFocus
                          value={p.name}
                          onPointerUp={(e) => handleRenamePage(p.id, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape") setEditingId(null);
                          }}
                          spellCheck={false}
                        />
                      ) : (
                        <span className={styles.pageNameText}>{p.name}</span>
                      )}
                    </div>

                    {pages.length > 1 && (
                      <button
                        className={styles.pageDeleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(p.id);
                        }}
                        aria-label="Delete page"
                        title="Delete page"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.sidebarFooter}>
              <button className={styles.sidebarBtn} onClick={handleAddPage} title="New page">
                + New
              </button>
              <button
                className={styles.sidebarBtn}
                onClick={handleDuplicatePage}
                title="Duplicate current page"
              >
                Duplicate
              </button>
            </div>
          </aside>
        )}

        <div className={styles.main}>
          <Drawing 
            key={activeSketch?.id ?? "sketch"}
            ref={drawingRef} 
            className={styles.canvas} 
            visible={currentPage === Page.Drawing}
            initialScene={activeSketch?.scene}
            onSceneChange={handleSceneChange}
          />
          {currentPage === Page.Mockup && <Mockup html={html} />}
          {/* Loading overlay */}
          {loading && (
            <div style={{position: "absolute", inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 200}}>
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>

      {/* Collaboration Dialog */}
      <CollaborationDialog
        isOpen={showCollabDialog}
        onClose={() => setShowCollabDialog(false)}
        collabId={collabId}
      />
    </div>
  );
}