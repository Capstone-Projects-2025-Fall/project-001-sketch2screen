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
  id: string;
  name: string;
  scene: SceneData;
};

/** Creates an empty Excalidraw scene */
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

/** Creates a new sketch page */
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

export default function App() {
  // Compute a stable collab id up-front so we can also use it for the very first page id.
  const initialCollabId = getCollabId();

  const [currentPage, setCurrentPage] = useState(Page.Drawing);
  // Make the **first page id deterministic** based on the collab id so both tabs share it.
  const [pages, setPages] = useState<SketchPage[]>(() => [{
    id: `${initialCollabId}-p1`,
    name: "Page 1",
    scene: makeEmptyScene(),
  }]);
  const [activePageId, setActivePageId] = useState<string>(() => `${initialCollabId}-p1`);

  const drawingRef = useRef<DrawingHandle | null>(null);
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState<string>("");
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
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [sceneVersion, setSceneVersion] = useState<number>(0);

  const activeIndex = useMemo(
    () => pages.findIndex((p) => p.id === activePageId),
    [pages, activePageId]
  );

  const activeSketch = pages[activeIndex] ?? pages[0];
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll active page into view
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
      if (isDrawingRef.current && needsRemountRef.current) {
        // Apply deferred remount once the stroke ends
        setSceneVersion((v: number) => v + 1);
      }
      isDrawingRef.current = false;
      needsRemountRef.current = false;
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
  }, [activePageId]);

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
      console.log(" Received scene update for:", sketchID, "Current active:", activePageId);
      suppressRemoteUpdates.current = true;

      setPages(prev => {
        const index = prev.findIndex(p => p.id === sketchID);
        if (index === -1) {
          console.warn(" Page not found:", sketchID);
          return prev;
        }
        const next = [...prev];
        
        // Filter out UI state that shouldn't be synced (tool selection, colors, etc.)
        const { currentItemStrokeColor, currentItemBackgroundColor, currentItemFillStyle, 
                currentItemStrokeWidth, currentItemStrokeStyle, currentItemRoughness,
                currentItemOpacity, currentItemFontFamily, currentItemFontSize, 
                currentItemTextAlign, currentItemStartArrowhead, currentItemEndArrowhead,
                ...syncedAppState } = sceneData.appState || {};
        
        next[index] = {
          ...next[index],
          scene: {
            elements: sceneData.elements,
            appState: {
              ...syncedAppState,
              collaborators: new Map(),
            },
            files: sceneData.files,
          },
        };
        return next;
      });

      // If this update is for the currently active page, force remount
      console.log("Checking remount:", sketchID, "===", activePageId, "?", sketchID === activePageId);
      if (sketchID === activePageId) {
        if (isDrawingRef.current) {
          console.log("Deferring remount until stroke end");
          needsRemountRef.current = true;
        } else {
          console.log(" Forcing remount for active page");
          setSceneVersion((v: number) => v + 1);
        }
      } else {
        console.log("⏭ Update for different page - will show when switched");
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
        const active = pages.find(p => p.id === activePageId) ?? pages[0];
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

  // Handle scene changes (drawing)
  const handleSceneChange = (scene: SceneData) => {
    setPages(prev => {
      const i = prev.findIndex(p => p.id === activePageId);
      if (i < 0) return prev;

      const next = [...prev];
      next[i] = { ...next[i], scene };

      // Send to collaborators with debounce
      if (collabEnabled && collabClientRef.current && !suppressRemoteUpdates.current) {
        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
        }

        updateTimerRef.current = setTimeout(() => {
          console.log(" Sending scene update for page:", activePageId);
          // IMPORTANT: Only send scene during drawing; page meta is for add/rename/delete
          collabClientRef.current?.sendSceneUpdate(activePageId, scene);
        }, 500);
      }

      return next;
    });
  };

  // === PAGE MANAGEMENT ===
  const handleAddPage = () => {
    const newPage = makeNewSketchPage(pages.length + 1);
    setPages(prev => [...prev, newPage]);
    setActivePageId(newPage.id);

    if (collabEnabled && collabClientRef.current) {
      collabClientRef.current.sendPageUpdate(newPage.id, newPage.name);
    }
  };

  const handleDuplicatePage = () => {
    if (!activeSketch) return;

    const dupeScene: SceneData = JSON.parse(JSON.stringify(activeSketch.scene));
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

  const handleRenamePage = (id: string, name: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, name } : p));

    if (collabEnabled && collabClientRef.current) {
      collabClientRef.current.sendPageUpdate(id, name);
    }
  };

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

  // === GENERATE HTML ===
  const handleGenerate = async () => {
    const blob = await drawingRef.current?.getPNGBlob?.();
    if (!blob) {
      alert("Please create a sketch first");
      return;
    }

    const sketch = new FormData();
    sketch.append("file", new File([blob], "sketch.png", { type: "image/png" }));

    setLoading(true);
    try {
      const res = await fetch("/api/generate/", {
        method: "POST",
        body: sketch,
      });

      if (!res.ok) {
        alert("Failed to generate HTML");
        return;
      }

      const data = (await res.json()) as { html?: string };
      const htmlStr = (data.html ?? "").trim();
      if (!htmlStr) {
        alert("No HTML received");
        return;
      }
      
      setHtml(htmlStr);
      setCurrentPage(Page.Mockup);
    } finally {
      setLoading(false);
    }
  };

  const handleShowCollaboration = () => {
    setCollabEnabled(true);
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
        {currentPage === Page.Drawing && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>Pages</div>

            <div className={styles.pageList}>
              {pages.map(p => {
                const selected = p.id === activePageId;
                const isEditing = editingId === p.id;

                return (
                  <div
                    key={p.id}
                    ref={node => { itemRefs.current[p.id] = node; }}
                    className={`${styles.pageItem} ${selected ? styles.pageItemSelected : ""}`}
                    onClick={() => {
                      setActivePageId(p.id);
                      setEditingId(null);
                    }}
                    onDoubleClick={e => {
                      e.stopPropagation();
                      setEditingId(p.id);
                    }}
                    title={p.name}
                  >
                    <div className={styles.pageItemLabel}>
                      <span className={styles.pageIcon} aria-hidden />
                      {isEditing ? (
                        <input
                          className={styles.pageNameInput}
                          autoFocus
                          value={p.name}
                          onChange={e => handleRenamePage(p.id, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={e => {
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
                        onClick={e => {
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

        <div className={styles.main} ref={canvasHostRef}>
          <Drawing
            key={`${activeSketch?.id}-v${sceneVersion}`}
            ref={drawingRef}
            className={styles.canvas}
            visible={currentPage === Page.Drawing}
            initialScene={activeSketch?.scene}
            onSceneChange={handleSceneChange}
          />
          {currentPage === Page.Mockup && <Mockup html={html} />}
          {loading && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.6)',
              zIndex: 200
            }}>
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>

      <CollaborationDialog
        isOpen={showCollabDialog}
        onClose={() => setShowCollabDialog(false)}
        collabId={collabId}
      />
    </div>
  );
}