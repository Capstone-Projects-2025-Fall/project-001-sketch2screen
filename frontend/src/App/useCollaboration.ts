import { useEffect, useRef, useState } from "react";
import CollabClient from "./CollabClient";
import type { SceneData } from "./Drawing";
import type { SketchPage } from "./sketchPage";

export interface UseCollaborationParams {
  /** Initial collaboration ID from URL or generated */
  collabId: string;
  /** Current pages in the application */
  pages: SketchPage[];
  /** ID of the currently active page */
  activePageId: string;
  /** Ref that tracks the current active page ID */
  activePageIdRef: React.MutableRefObject<string>;
  /** Setter for pages state */
  setPages: React.Dispatch<React.SetStateAction<SketchPage[]>>;
  /** Setter for active page ID */
  setActivePageId: React.Dispatch<React.SetStateAction<string>>;
  /** Setter for editing ID */
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  /** Function to create an empty scene */
  makeEmptyScene: () => SceneData;
  /** Optional ref to the canvas host element for pointer event handling */
  canvasHostRef?: React.RefObject<HTMLDivElement | null>;
}

export interface UseCollaborationReturn {
  /** Whether collaboration is currently enabled */
  collabEnabled: boolean;
  /** Whether to show the collaboration dialog */
  showCollabDialog: boolean;
  /** The collaboration ID */
  collabId: string;
  /** Current scene version (increments on remount) */
  sceneVersion: number;
  /** Ref to the CollabClient instance */
  collabClientRef: React.MutableRefObject<CollabClient | null>;
  /** Ref tracking if user is currently drawing */
  isDrawingRef: React.MutableRefObject<boolean>;
  /** Ref for pending scene data to send after stroke completes */
  pendingSceneRef: React.MutableRefObject<{ pageId: string; scene: SceneData } | null>;
  /** Function to show collaboration dialog */
  handleShowCollaboration: () => void;
  /** Function to close collaboration dialog */
  handleCloseCollabDialog: () => void;
  /** Callback to handle scene changes with collaboration */
  handleCollabSceneChange: (scene: SceneData, oldScene?: SceneData) => void;
  /** Callback to notify collaboration of new page */
  notifyPageAdded: (pageId: string, pageName: string) => void;
  /** Callback to notify collaboration of page duplicate */
  notifyPageDuplicated: (pageId: string, pageName: string, scene: SceneData) => void;
  /** Callback to notify collaboration of page rename */
  notifyPageRenamed: (pageId: string, pageName: string) => void;
  /** Callback to notify collaboration of page deletion */
  notifyPageDeleted: (pageId: string) => void;
}

/**
 * Custom hook to manage collaboration features
 * Handles WebSocket connections, scene synchronization, and pointer event tracking
 */
export function useCollaboration({
  collabId,
  pages,
  activePageId,
  activePageIdRef,
  setPages,
  setActivePageId,
  setEditingId,
  makeEmptyScene,
  canvasHostRef,
}: UseCollaborationParams): UseCollaborationReturn {
  // Collaboration state
  const [showCollabDialog, setShowCollabDialog] = useState(false);
  const [collabEnabled, setCollabEnabled] = useState(false);
  const collabClientRef = useRef<CollabClient | null>(null);
  
  // Track if the local user is currently drawing to avoid mid-stroke remounts
  const isDrawingRef = useRef(false);
  const needsRemountRef = useRef(false);
  
  // Track pending scene data to send after stroke completes
  const pendingSceneRef = useRef<{ pageId: string; scene: SceneData } | null>(null);
  const [sceneVersion, setSceneVersion] = useState<number>(0);

  // === POINTER EVENT HANDLING ===
  // Avoid remounts during a local stroke: detect pointer activity on the canvas host
  useEffect(() => {
    const host: EventTarget = canvasHostRef?.current ?? document;
    
    const onDown = () => { 
      isDrawingRef.current = true; 
    };
    
    const end = () => {
      const wasDrawing = isDrawingRef.current;
      isDrawingRef.current = false;
      
      // Apply deferred remount if needed
      if (wasDrawing && needsRemountRef.current) {
        setSceneVersion((v: number) => v + 1);
        needsRemountRef.current = false;
      }
      
      // Send pending scene data after stroke completes
      if (wasDrawing && collabEnabled && collabClientRef.current) {
        if (pendingSceneRef.current) {
          const { pageId, scene } = pendingSceneRef.current;
          console.log("Stroke complete - sending scene update:", pageId);
          collabClientRef.current.sendSceneUpdate(pageId, scene);
          pendingSceneRef.current = null;
        } else {
          setPages(prev => {
            const i = prev.findIndex(p => p.id === activePageId);
            if (i >= 0) {
              const currentScene = prev[i].scene;
              collabClientRef.current?.sendSceneUpdate(activePageId, {
                ...currentScene,
                appState: null
              });
            }
            return prev;
          });
        }
      } else if (wasDrawing) {
        console.log("Stroke complete - collaboration not enabled or client not ready");
      }
    };

    host.addEventListener('pointerdown', onDown as any, { passive: true, capture: true } as any);
    host.addEventListener('pointerup', end as any, { passive: true, capture: true } as any);
    host.addEventListener('pointercancel', end as any, { passive: true, capture: true } as any);
    host.addEventListener('pointerleave', end as any, { passive: true, capture: true } as any);

    return () => {
      host.removeEventListener('pointerdown', onDown as any, true);
      host.removeEventListener('pointerup', end as any, true);
      host.removeEventListener('pointercancel', end as any, true);
      host.removeEventListener('pointerleave', end as any, true);
    };
  }, [activePageId, collabEnabled, canvasHostRef, setPages]);

  // === COLLABORATION WEBSOCKET SETUP ===
  useEffect(() => {
    if (!collabEnabled) return;

    console.log("Starting collaboration with ID:", collabId);
    const client = new CollabClient(Number(collabId));
    collabClientRef.current = client;

    // Handle incoming page updates
    client.setPageUpdateHandler((sketchID: string, name: string | null) => {
      console.log("Received page update:", sketchID, name);

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
          console.log("🔄 Replacing empty default page with collaborator page:", sketchID);
          // Only switch to received page on initial replacement
          setActivePageId(sketchID);
          return [{ id: sketchID, name: name ?? "Page 1", scene: prev[0].scene ?? makeEmptyScene() }];
        }

        console.log("Adding page from collaborator:", sketchID, "- NOT switching to it");
        // Add new page but DON'T switch to it
        return [...prev, { id: sketchID, name: name ?? "Page 1", scene: makeEmptyScene() }];
      });
    });

    // Handle incoming scene updates
    client.setSceneUpdateHandler((sketchID: string, sceneData: SceneData) => {
      const currentActivePageId = activePageIdRef.current;
      console.log("Received scene update for:", sketchID, "Current active:", currentActivePageId);

      setPages(prev => {
        const index = prev.findIndex(p => p.id === sketchID);
        if (index === -1) {
          console.warn("Page not found:", sketchID);
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
          console.log("Forcing remount for active page");
          setSceneVersion((v: number) => v + 1);
        }
      } else {
        console.log("Update for different page - will show when switched");
      }
    });

    // When WebSocket opens, send ONLY the active page once
    client.connection.onopen = () => {
      console.log("WebSocket connected");
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

  // === PUBLIC API ===
  
  const handleShowCollaboration = () => {
    setCollabEnabled(true);
    setShowCollabDialog(true);
  };

  const handleCloseCollabDialog = () => {
    setShowCollabDialog(false);
  };

  /**
   * Handle scene changes with collaboration support
   * Should be called from the main handleSceneChange function
   */
  const handleCollabSceneChange = (scene: SceneData, oldScene?: SceneData) => {
    if (collabEnabled && collabClientRef.current) 
    {
      const elementsChanged = oldScene?.elements !== scene.elements;
      const filesChanged = oldScene?.files !== scene.files;

      if (elementsChanged || filesChanged) {
        const sceneToSend = { ...scene, appState: null };

        if (isDrawingRef.current) {
          pendingSceneRef.current = { pageId: activePageId, scene: sceneToSend };
        } else {
          collabClientRef.current.sendSceneUpdate(activePageId, sceneToSend);
        }
      }
    }

  };

  /**
   * Notify collaboration system of a new page
   */
  const notifyPageAdded = (pageId: string, pageName: string) => {
    if (collabEnabled && collabClientRef.current) {
      console.log("Sending page update:", pageId, pageName);
      collabClientRef.current.sendPageUpdate(pageId, pageName);
    }
  };

  /**
   * Notify collaboration system of a duplicated page
   */
  const notifyPageDuplicated = (pageId: string, pageName: string, scene: SceneData) => {
    if (collabEnabled && collabClientRef.current) {
      collabClientRef.current.sendPageUpdate(pageId, pageName);
      collabClientRef.current.sendSceneUpdate(pageId, { ...scene, appState: null });
    }
  };

  /**
   * Notify collaboration system of a renamed page
   */
  const notifyPageRenamed = (pageId: string, pageName: string) => {
    if (collabEnabled && collabClientRef.current) {
      collabClientRef.current.sendPageUpdate(pageId, pageName);
    }
  };

  /**
   * Notify collaboration system of a deleted page
   */
  const notifyPageDeleted = (pageId: string) => {
    if (collabEnabled && collabClientRef.current) {
      console.log("Sending page deletion:", pageId);
      collabClientRef.current.sendPageUpdate(pageId, null);
    }
  };

  return {
    collabEnabled,
    showCollabDialog,
    collabId,
    sceneVersion,
    collabClientRef,
    isDrawingRef,
    pendingSceneRef,
    handleShowCollaboration,
    handleCloseCollabDialog,
    handleCollabSceneChange,
    notifyPageAdded,
    notifyPageDuplicated,
    notifyPageRenamed,
    notifyPageDeleted,
  };
}