import { useEffect, useRef, useState, useCallback } from "react";
import CollabClient from "./CollabClient";
import type { CollaboratorInfo } from "./CollabClient";
import type { DrawingHandle, SceneData, SceneUpdate } from "./Drawing";
import type { SketchPage } from "./sketchPage";
import {generateDiff, applyDiff, clone} from "./util";
import {restoreElements} from "@excalidraw/excalidraw";

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
  /** Ref to the drawing components (one per page) for updating scenes */
  drawingRef?: React.MutableRefObject<Record<string, DrawingHandle | null>>;
}

export interface UseCollaborationReturn {
  /** Whether collaboration is currently enabled */
  collabEnabled: boolean;
  /** Whether to show the collaboration dialog */
  showCollabDialog: boolean;
  /** Whether we're waiting for username input */
  needsUsername: boolean;
  /** The collaboration ID */
  collabId: string;
  /** Current scene version (increments on remount) */
  sceneVersion: number;
  /** Ref to the CollabClient instance */
  collabClientRef: React.MutableRefObject<CollabClient | null>;
  /** Ref tracking if user is currently drawing */
  isDrawingRef: React.MutableRefObject<boolean>;
  /** Ref for pending scene data to send after stroke completes */
  pendingSceneDiffRef: React.MutableRefObject<{ pageId: string; sceneDiff: SceneData } | null>;
  /** Map of collaborators for Excalidraw */
  collaborators: Map<string, any>;
  /** Function to show collaboration dialog */
  handleShowCollaboration: () => void;
  /** Function to close collaboration dialog */
  handleCloseCollabDialog: () => void;
  /** Function to confirm username and start collaboration */
  handleConfirmUsername: (username: string) => void;
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
  drawingRef,
}: UseCollaborationParams): UseCollaborationReturn {
  // Collaboration state
  const [showCollabDialog, setShowCollabDialog] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(true);
  const [collabEnabled, setCollabEnabled] = useState(false);
  const [username, setUsername] = useState<string>("");
  const collabClientRef = useRef<CollabClient | null>(null);
  
  // Track if the local user is currently drawing to avoid mid-stroke remounts
  const isDrawingRef = useRef(false);
  
  // Track pending scene data to apply after stroke completes
  const pendingSceneDiffRef = useRef<{ pageId: string; sceneDiff: SceneData } | null>(null);
  const [sceneVersion, setSceneVersion] = useState<number>(0);

  // Collaborators map for Excalidraw
  const [collaborators, setCollaborators] = useState<Map<string, any>>(new Map());

  // Throttle pointer updates to avoid flooding the WebSocket
  const lastPointerSendTime = useRef<number>(0);
  const POINTER_THROTTLE_MS = 50; // Send at most every 50ms

  //Hold reference to last sent scene
  const lastSentScene = useRef(pages.find((p) => p.id === activePageId)?.scene)
  useEffect(() => {
    lastSentScene.current = pages.find((p) => p.id === activePageId)?.scene
  }, [activePageId])

  function updatePageFromDiff(page: string, sceneDiff: SceneData) {
    setPages(prev => {
      const index = prev.findIndex(p => p.id === page);
      if (index === -1) {
        console.warn("Page not found:", page);
        return prev;
      }
      const next = [...prev];

      let sceneData = applyDiff(next[index].scene, sceneDiff)

      lastSentScene.current = clone(sceneData);

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
  }

  // === POINTER EVENT HANDLING ===
  // Avoid remounts during a local stroke: detect pointer activity on the canvas host
  useEffect(() => {
    const host: EventTarget = canvasHostRef?.current ?? document;
    
    const onDown = () => { 
      isDrawingRef.current = true; 
    };
    
    const onMove = (e: PointerEvent) => {
      // Send pointer updates to other collaborators
      if (collabEnabled && collabClientRef.current) {
        const now = Date.now();
        if (now - lastPointerSendTime.current > POINTER_THROTTLE_MS) {
          // Get canvas element to calculate relative coordinates
          const canvas = canvasHostRef?.current?.querySelector('canvas');
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            collabClientRef.current.sendPointerUpdate({ x, y });
            lastPointerSendTime.current = now;
          }
        }
      }
    };
    
    const end = () => {
      const wasDrawing = isDrawingRef.current;
      isDrawingRef.current = false;
      
      // Apply pending scene data after stroke completes
      if (wasDrawing && collabEnabled && collabClientRef.current) {
        if (pendingSceneDiffRef.current) {
          updatePageFromDiff(pendingSceneDiffRef.current.pageId, pendingSceneDiffRef.current.sceneDiff)
          console.log("Stroke complete - applying scene update:");
          pendingSceneDiffRef.current = null;
        }
      } else if (wasDrawing) {
        console.log("Stroke complete - collaboration not enabled or client not ready");
      }
    };

    host.addEventListener('pointerdown', onDown as any, { passive: true, capture: true } as any);
    host.addEventListener('pointermove', onMove as any, { passive: true, capture: true } as any);
    host.addEventListener('pointerup', end as any, { passive: true, capture: true } as any);
    host.addEventListener('pointercancel', end as any, { passive: true, capture: true } as any);
    host.addEventListener('pointerleave', end as any, { passive: true, capture: true } as any);

    return () => {
      host.removeEventListener('pointerdown', onDown as any, true);
      host.removeEventListener('pointermove', onMove as any, true);
      host.removeEventListener('pointerup', end as any, true);
      host.removeEventListener('pointercancel', end as any, true);
      host.removeEventListener('pointerleave', end as any, true);
    };
  }, [activePageId, collabEnabled, canvasHostRef]);

  // === COLLABORATION WEBSOCKET SETUP ===
  useEffect(() => {
    // Only connect to WebSocket if both collabEnabled AND username are set
    if (!collabEnabled || !username) {
      console.log("Waiting for collaboration enable and username", { collabEnabled, hasUsername: !!username });
      return;
    }

    console.log("Starting collaboration with ID:", collabId, "Username:", username);
    const client = new CollabClient(Number(collabId), username);
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
    client.setSceneUpdateHandler((sketchID: string, sceneDiff: SceneData) => {
      let currentActivePageId = activePageIdRef.current;
      console.log("Received scene update for:", sketchID, "Current active:", currentActivePageId);

      // If this update is for the currently active page, force remount
      console.log("Checking remount:", sketchID, "===", currentActivePageId, "?", sketchID === currentActivePageId);
      if (sketchID === currentActivePageId) {
        if (isDrawingRef.current) {
          console.log("stacking diff")
          let currentPendingDiff = pendingSceneDiffRef.current;

          if(currentPendingDiff) {
            currentPendingDiff.sceneDiff = applyDiff(currentPendingDiff.sceneDiff, sceneDiff);
          } else {
            pendingSceneDiffRef.current = {pageId: sketchID, sceneDiff}
          }

        } else {
          console.log("Forcing remount for active page");
          updatePageFromDiff(sketchID, sceneDiff)
          setSceneVersion((v: number) => v + 1);
        }
      } else {
        updatePageFromDiff(sketchID, sceneDiff)
        console.log("Update for different page - will show when switched");
      }
    });

    // Handle collaborator join
    client.setCollaboratorJoinHandler((collaborator: CollaboratorInfo) => {
      console.log("COLLABORATOR: Collaborator joined:", collaborator.username, "ID:", collaborator.id);
      setCollaborators(prev => {
        const next = new Map(prev);
        const color = getCollaboratorColor(collaborator.id);
        next.set(collaborator.id, {
          pointer: collaborator.pointer ?? { x: 0, y: 0 },
          button: "up",
          selectedElementIds: {},
          username: collaborator.username,
          userState: "active",
          color: {
            background: color,
            stroke: color,
          },
        });
        console.log("COLLABORATOR: Collaborators Map now has", next.size, "members");
        return next;
      });
    });

    // Handle collaborator leave
    client.setCollaboratorLeaveHandler((userID: string) => {
      console.log("COLLABORATOR: Collaborator left:", userID);
      setCollaborators(prev => {
        const next = new Map(prev);
        next.delete(userID);
        console.log("COLLABORATOR: Collaborators Map now has", next.size, "members");
        return next;
      });
    });

    // Handle collaborator pointer updates
    client.setCollaboratorPointerHandler((userID: string, pointer: { x: number; y: number } | null) => {
      console.log("COLLABORATOR: Pointer update from:", userID, pointer);
      setCollaborators(prev => {
        const collaborator = prev.get(userID);
        if (!collaborator) {
          console.warn("WARN COLLABORATOR: Received pointer update for unknown collaborator:", userID);
          return prev;
        }

        const next = new Map(prev);
        next.set(userID, {
          ...collaborator,
          pointer: pointer ?? { x: 0, y: 0 },
        });
        return next;
      });
    });

    // When WebSocket opens, send collaborator join and active page
    client.connection.onopen = () => {
      console.log("WebSocket connected");
      
      // Send collaborator join immediately
      client.sendCollaboratorJoin();
      console.log("COLLABORATOR: Sent collaborator_join message");
      
      setTimeout(() => {
        const active = pages.find(p => p.id === activePageIdRef.current) ?? pages[0];
        client.sendPageUpdate(active.id, active.name);
        if ((active.scene?.elements?.length ?? 0) > 0) {
          //client.sendSceneUpdate(active.id, active.scene);
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
  }, [collabEnabled, collabId, username]);

  // Update Excalidraw scene with collaborators whenever they change
  const updateSceneCollaborators = useCallback(() => {
    if (!drawingRef?.current) {
      console.log("WARN COLLABORATOR: updateSceneCollaborators: drawingRef not available");
      return;
    }
    
    // Get the active page's drawing ref
    const activeDrawingRef = drawingRef.current[activePageId];
    if (!activeDrawingRef) {
      console.log("WARN COLLABORATOR: updateSceneCollaborators: activeDrawingRef not available for", activePageId);
      return;
    }
    
    // Get current scene and update with collaborators
    const currentPage = pages.find(p => p.id === activePageId);
    if (currentPage) {
      console.log("COLLABORATOR: Updating scene with collaborators:", {
        count: collaborators.size,
        collaborators: Array.from(collaborators.entries()).map(([id, collab]) => ({
          id,
          username: collab.username,
          pointer: collab.pointer
        }))
      });
      
      activeDrawingRef.updateScene({
        collaborators: collaborators,
      });
    }
  }, [collaborators, activePageId, pages, drawingRef]);

  // Trigger scene update whenever collaborators change
  useEffect(() => {
    console.log("COLLABORATOR: Collaborators effect triggered. Size:", collaborators.size, "Collab enabled:", collabEnabled);
    console.log("COLLABORATOR: Collaborators content:", Array.from(collaborators.entries()).map(([id, data]) => ({
      id,
      username: data.username,
      hasPointer: !!data.pointer,
      hasColor: !!data.color
    })));
    
    if (collaborators.size > 0) {
      console.log("COLLABORATOR: Collaborators changed, updating scene");
      updateSceneCollaborators();
    } else {
      console.log("WARN COLLABORATOR: Collaborators Map is empty, skipping update");
    }
  }, [collaborators, updateSceneCollaborators]);

  // === PUBLIC API ===
  
  const handleShowCollaboration = () => {
    setNeedsUsername(true);
    setShowCollabDialog(true);
  };

  const handleCloseCollabDialog = () => {
    setShowCollabDialog(false);
    // Reset username state if they closed without confirming
    if (needsUsername && !collabEnabled) {
      setNeedsUsername(true);
    }
  };

  const handleConfirmUsername = (newUsername: string) => {
    setUsername(newUsername);
    setNeedsUsername(false);
    setCollabEnabled(true);
    // Keep dialog open to show the collaboration link
  };

  /**
   * Handle scene changes with collaboration support
   * Should be called from the main handleSceneChange function
   */
  const handleCollabSceneChange = (scene: SceneData) => {
    //if (scene.appState?.editingTextElement) { return; }
    if (collabEnabled && collabClientRef.current) 
    {
      const sceneToSend = generateDiff(lastSentScene.current, scene);
      if(sceneToSend === undefined) return;
      if(sceneToSend.elements === undefined && sceneToSend.files === undefined) return;
      delete sceneToSend.appState 

      collabClientRef.current.sendSceneUpdate(activePageId, sceneToSend);
      lastSentScene.current = clone(scene);
      console.log("sending ", sceneToSend)
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
    needsUsername,
    collabId,
    sceneVersion,
    collabClientRef,
    isDrawingRef,
    pendingSceneDiffRef,
    collaborators,
    handleShowCollaboration,
    handleCloseCollabDialog,
    handleConfirmUsername,
    handleCollabSceneChange,
    notifyPageAdded,
    notifyPageDuplicated,
    notifyPageRenamed,
    notifyPageDeleted,
  };
}

/**
 * Generate a consistent color for a collaborator based on their ID
 */
function getCollaboratorColor(userId: string): string {
  const colors = [
    '#e91e63', // pink
    '#9c27b0', // purple
    '#673ab7', // blue purple
    '#3f51b5', // indigo
    '#2196f3', // blue
    '#00bcd4', // cyan
    '#009688', // teal
    '#4caf50', // green
    '#ff9800', // orange
    '#ff5722', // Red orange
  ];
  
  // Generate a hash from the userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}
