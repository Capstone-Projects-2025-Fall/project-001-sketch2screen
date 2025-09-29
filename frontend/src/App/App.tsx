import styles from "./App.module.css";
import { useMemo, useRef, useState, useEffect } from "react";

import Navbar from "./Navbar";
import type { DrawingHandle, SceneData } from "./Drawing";
import Mockup from "./Mockup";
import Drawing from "./Drawing";
import { LoadingSpinner } from "./LoadingScreen";

export enum Page {
  Drawing,
  Mockup
}

//A single sketch page
type SketchPage = {
  id: string;
  name: string;
  scene: SceneData; // Excalidraw elements + appState + files
};

function makeEmptyScene(): SceneData {
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

function makeNewSketchPage(index: number): SketchPage {
  return {
    id: crypto.randomUUID(),
    name: `Page ${index}`,
    scene: makeEmptyScene(),
  };
}

export default function App() {
  //Represents which page is currently shown.
  const [currentPage, setCurrentPage] = useState(Page.Drawing);
  
  // Multi-page sketch state
  const [pages, setPages] = useState<SketchPage[]>(() => [makeNewSketchPage(1)]);
  const [activePageId, setActivePageId] = useState<string>(() => pages[0].id);
  
  //Reference to the Drawing component.
  const drawingRef = useRef<DrawingHandle | null>(null);

  //Holds the HTML returned by the backend so we can render it on the Design page
  const [html, setHtml] = useState<string>("");
  // Loading indicator while backend is processing
  const [loading, setLoading] = useState(false);

  //Use state for when user wants to change the filename
  const [filename, setFilename] = useState<string>("");

  //State for which page is being renamed
  const [editingId, setEditingId] = useState<string | null>(null);

    // Convenience getters
  const activeIndex = useMemo(
    () => pages.findIndex((p) => p.id === activePageId),
    [pages, activePageId]
  );
  const activeSketch = pages[activeIndex] ?? pages[0];

  // Keep DOM refs for each page row
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // When active page changes, ensure it’s highlighted
  useEffect(() => {
    const el = itemRefs.current[activePageId];
    if (el) {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activePageId, pages.length]);


  // Excalidraw onChange stash scene into the active page
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

  // Add a new blank page and switch to it
  const handleAddPage = () => {
    const newPage = makeNewSketchPage(pages.length + 1);
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
  };

  // Duplicate current page 
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

  // Rename current page
  const handleRenamePage = (id: string, name: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  // Remove current page 
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

  //Called when user clicks the "Generate" button in the Navbar.
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
  }

  return (
    <div className={styles.appRoot}>
      <Navbar
        curPage={currentPage}
        onPageChange={setCurrentPage}
        onGenerate={handleGenerate}
        filename={filename}
        onFilenameChange={setFilename}
      />

      <div className={styles.workRow}>
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
                    ref={(node) => { itemRefs.current[p.id] = node; }}  // <-- add this

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
                          onChange={(e) => handleRenamePage(p.id, e.target.value)}
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
        {currentPage === Page.Mockup && <Mockup html = {html} />}
        {/* Loading overlay */}
        {loading && (
          <div style={{position: "absolute", inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 200}}>
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
