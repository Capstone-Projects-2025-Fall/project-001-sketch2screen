# CollabClient Class

WebSocket client for real-time collaboration in Sketch2Screen.

## Overview

**File:** `frontend/src/App/CollabClient.ts`

The `CollabClient` class manages WebSocket connections to enable real-time collaboration between multiple users working on the same sketch. It handles sending and receiving scene updates and page operations (create, rename, delete).

## Class Definition

```typescript
export default class CollabClient {
  collabID: number;
  connection: WebSocket;
  sceneUpdateHandler: ((sketchID: string, sceneData: SceneData) => void) | null;
  pageUpdateHandler: ((sketchID: string, name: string | null) => void) | null;
}
```

---

## Constructor

### `constructor(collabID)`

Creates a new collaboration client and establishes WebSocket connection.

**Signature:**
```typescript
constructor(collabID: number)
```

**Parameters:**
- `collabID` (number) - Unique identifier for the collaboration session

**WebSocket URL:**
```
ws://{hostname}:{port}/ws/collab/{collabID}/
```

**Example:**
```typescript
const client = new CollabClient(12345);
// Connects to: ws://localhost:8000/ws/collab/12345/
```

**Connection Lifecycle Events:**

```typescript
connection.onopen = () => {
  console.log("WebSocket connected for collaboration:", collabID);
};

connection.onerror = (error) => {
  console.error("WebSocket error:", error);
};

connection.onclose = () => {
  console.log("WebSocket disconnected");
};
```

---

## Properties

### `collabID`

**Type:** `number`

**Description:** Unique identifier for this collaboration session. Used to filter incoming messages and construct WebSocket URL.

**Example:**
```typescript
const client = new CollabClient(12345);
console.log(client.collabID); // 12345
```

---

### `connection`

**Type:** `WebSocket`

**Description:** Active WebSocket connection to the collaboration server.

**States:**
- `WebSocket.CONNECTING` (0) - Connection is being established
- `WebSocket.OPEN` (1) - Connection is open and ready
- `WebSocket.CLOSING` (2) - Connection is closing
- `WebSocket.CLOSED` (3) - Connection is closed

**Example:**
```typescript
if (client.connection.readyState === WebSocket.OPEN) {
  console.log("Connected and ready");
}
```

---

### `sceneUpdateHandler`

**Type:** `((sketchID: string, sceneData: SceneData) => void) | null`

**Description:** Callback function invoked when a scene update is received from another collaborator.

**Set via:** `setSceneUpdateHandler()`

**Parameters:**
- `sketchID` (string) - ID of the sketch that was updated
- `sceneData` (SceneData) - The updated scene data

---

### `pageUpdateHandler`

**Type:** `((sketchID: string, name: string | null) => void) | null`

**Description:** Callback function invoked when a page update is received from another collaborator.

**Set via:** `setPageUpdateHandler()`

**Parameters:**
- `sketchID` (string) - ID of the sketch page
- `name` (string | null) - New name, or `null` if page was deleted

---

## Methods

### `setSceneUpdateHandler(handler)`

Registers a callback to handle incoming scene updates from other collaborators.

**Signature:**
```typescript
setSceneUpdateHandler(
  handler: (sketchID: string, sceneData: SceneData) => void
): void
```

**Parameters:**
- `handler` - Callback function with:
  - `sketchID` (string) - ID of the updated sketch
  - `sceneData` (SceneData) - New scene data

**Example:**
```typescript
client.setSceneUpdateHandler((sketchID, sceneData) => {
  console.log(`Scene ${sketchID} was updated by a collaborator`);

  // Update local state
  setPages(prev => prev.map(page =>
    page.id === sketchID
      ? { ...page, scene: sceneData }
      : page
  ));
});
```

**Usage in React:**
```typescript
useEffect(() => {
  const client = new CollabClient(collabID);

  client.setSceneUpdateHandler((sketchID, sceneData) => {
    // Update state with remote changes
    setPages(prev => prev.map(page =>
      page.id === sketchID ? { ...page, scene: sceneData } : page
    ));
  });

  return () => client.disconnect();
}, []);
```

---

### `sendSceneUpdate(sketchID, sceneData)`

Sends a scene update to all other collaborators in the session.

**Signature:**
```typescript
sendSceneUpdate(sketchID: string, sceneData: SceneData): void
```

**Parameters:**
- `sketchID` (string) - ID of the sketch being updated
- `sceneData` (SceneData) - The updated scene data

**Behavior:**
1. Checks if WebSocket connection is open
2. Creates a clean, serializable copy of scene data
3. Removes non-serializable properties (e.g., `collaborators` Map)
4. Sends JSON message to server
5. Logs warning if connection is not open

**Message Format:**
```json
{
  "action": "scene_update",
  "sketchID": "page-1",
  "sketchData": {
    "elements": [...],
    "appState": {...},
    "files": {...}
  }
}
```

**Example:**
```typescript
const handleSceneChange = (sceneData: SceneData) => {
  // Update local state
  setCurrentScene(sceneData);

  // Broadcast to collaborators
  collabClient.sendSceneUpdate(activePageId, sceneData);
};
```

**Data Cleaning:**

The method removes non-serializable objects before sending:

```typescript
const cleanAppState = { ...sceneData.appState };
delete cleanAppState.collaborators; // Remove Map object

const cleanSceneData = {
  elements: JSON.parse(JSON.stringify(sceneData.elements)),
  appState: cleanAppState,
  files: JSON.parse(JSON.stringify(sceneData.files))
};
```

**Error Handling:**
```typescript
try {
  client.sendSceneUpdate(pageId, sceneData);
} catch (error) {
  console.error("Failed to send scene update:", error);
}
```

---

### `setPageUpdateHandler(handler)`

Registers a callback to handle incoming page updates (create, rename, delete) from other collaborators.

**Signature:**
```typescript
setPageUpdateHandler(
  handler: (sketchID: string, name: string | null) => void
): void
```

**Parameters:**
- `handler` - Callback function with:
  - `sketchID` (string) - ID of the affected page
  - `name` (string | null) - New name, or `null` if deleted

**Example:**
```typescript
client.setPageUpdateHandler((sketchID, pageName) => {
  if (pageName === null) {
    // Page was deleted
    console.log(`Page ${sketchID} was deleted`);
    setPages(prev => prev.filter(p => p.id !== sketchID));
  } else {
    // Page was created or renamed
    console.log(`Page ${sketchID} renamed to "${pageName}"`);
    setPages(prev => {
      const existing = prev.find(p => p.id === sketchID);
      if (existing) {
        // Rename existing page
        return prev.map(p =>
          p.id === sketchID ? { ...p, name: pageName } : p
        );
      } else {
        // Create new page
        return [...prev, {
          id: sketchID,
          name: pageName,
          scene: makeEmptyScene()
        }];
      }
    });
  }
});
```

---

### `sendPageUpdate(sketchID, pageName)`

Sends a page operation (create, rename, or delete) to all other collaborators.

**Signature:**
```typescript
sendPageUpdate(sketchID: string, pageName: string | null): void
```

**Parameters:**
- `sketchID` (string) - ID of the page
- `pageName` (string | null) - New name, or `null` to delete

**Message Format:**
```json
{
  "action": "page_update",
  "sketchID": "page-2",
  "pageName": "About Us"
}
```

**Examples:**

**Create/Rename Page:**
```typescript
const createPage = () => {
  const newPage = {
    id: crypto.randomUUID(),
    name: "New Page",
    scene: makeEmptyScene()
  };

  setPages([...pages, newPage]);
  collabClient.sendPageUpdate(newPage.id, newPage.name);
};

const renamePage = (id: string, newName: string) => {
  setPages(prev => prev.map(p =>
    p.id === id ? { ...p, name: newName } : p
  ));

  collabClient.sendPageUpdate(id, newName);
};
```

**Delete Page:**
```typescript
const deletePage = (id: string) => {
  setPages(prev => prev.filter(p => p.id !== id));
  collabClient.sendPageUpdate(id, null); // null = delete
};
```

---

### `disconnect()`

Closes the WebSocket connection.

**Signature:**
```typescript
disconnect(): void
```

**Example:**
```typescript
// In React cleanup
useEffect(() => {
  const client = new CollabClient(collabID);

  return () => {
    client.disconnect();
  };
}, []);
```

**Note:** This method is not explicitly defined in the class but is accessed via:
```typescript
client.connection.close();
```

---

## Message Filtering

The client implements session isolation by filtering incoming messages based on collaboration ID.

**Filter Logic:**
```typescript
const sketchID = message.sketchID;
const expectedPrefix = `${this.collabID}-`;

if (!sketchID || !sketchID.startsWith(expectedPrefix)) {
  console.log(`Ignoring message for different collab session`);
  return;
}
```

**Why This Matters:**

- Prevents cross-contamination between different collaboration sessions
- Ensures users only see updates for their own session
- First page ID is deterministic: `${collabID}-p1`

**Example:**
```typescript
// Collaboration ID: 12345
// Valid sketch IDs: "12345-p1", "12345-p2", "12345-abc"
// Invalid sketch IDs: "67890-p1", "p1", "page-1"
```

---

## Complete Integration Example

### React Hook for Collaboration

```typescript
function useCollaboration(collabID: string) {
  const [client, setClient] = useState<CollabClient | null>(null);

  useEffect(() => {
    const collabClient = new CollabClient(Number(collabID));

    // Handle incoming scene updates
    collabClient.setSceneUpdateHandler((sketchID, sceneData) => {
      setPages(prev => prev.map(page =>
        page.id === sketchID
          ? { ...page, scene: sceneData }
          : page
      ));
    });

    // Handle incoming page updates
    collabClient.setPageUpdateHandler((sketchID, pageName) => {
      if (pageName === null) {
        setPages(prev => prev.filter(p => p.id !== sketchID));
      } else {
        setPages(prev => {
          const exists = prev.find(p => p.id === sketchID);
          if (exists) {
            return prev.map(p =>
              p.id === sketchID ? { ...p, name: pageName } : p
            );
          } else {
            return [...prev, {
              id: sketchID,
              name: pageName,
              scene: makeEmptyScene()
            }];
          }
        });
      }
    });

    setClient(collabClient);

    return () => {
      collabClient.connection.close();
    };
  }, [collabID]);

  return client;
}
```

### Using the Hook

```typescript
function App() {
  const collabID = getCollabId();
  const collabClient = useCollaboration(collabID);

  const handleSceneChange = (sceneData: SceneData) => {
    setPages(prev => prev.map(page =>
      page.id === activePageId
        ? { ...page, scene: sceneData }
        : page
    ));

    collabClient?.sendSceneUpdate(activePageId, sceneData);
  };

  const handlePageRename = (id: string, name: string) => {
    setPages(prev => prev.map(p =>
      p.id === id ? { ...p, name } : p
    ));

    collabClient?.sendPageUpdate(id, name);
  };

  // ... rest of component
}
```

---

## Best Practices

### 1. Avoid Echo

Prevent receiving your own updates back:

```typescript
const suppressRemoteUpdate = useRef(false);

const handleSceneChange = (sceneData: SceneData) => {
  suppressRemoteUpdate.current = true;

  setPages(prev => /* update */);
  collabClient?.sendSceneUpdate(activePageId, sceneData);

  setTimeout(() => {
    suppressRemoteUpdate.current = false;
  }, 100);
};

client.setSceneUpdateHandler((sketchID, sceneData) => {
  if (suppressRemoteUpdate.current) return;
  setPages(prev => /* update */);
});
```

### 2. Check Connection State

Always verify WebSocket is open before sending:

```typescript
const sendUpdate = (data: SceneData) => {
  if (collabClient?.connection.readyState === WebSocket.OPEN) {
    collabClient.sendSceneUpdate(activePageId, data);
  } else {
    console.warn("Cannot send update: WebSocket not connected");
  }
};
```

### 3. Handle Reconnection

Implement reconnection logic for network failures:

```typescript
const [reconnectAttempt, setReconnectAttempt] = useState(0);

useEffect(() => {
  const client = new CollabClient(collabID);

  client.connection.onclose = () => {
    if (reconnectAttempt < 5) {
      setTimeout(() => {
        setReconnectAttempt(prev => prev + 1);
      }, 2000 * Math.pow(2, reconnectAttempt)); // Exponential backoff
    }
  };

  return () => client.connection.close();
}, [reconnectAttempt]);
```

### 4. Serialize Data Properly

Ensure all data is JSON-serializable:

```typescript
const cleanScene = (scene: SceneData): SceneData => {
  return {
    elements: JSON.parse(JSON.stringify(scene.elements)),
    appState: {
      ...scene.appState,
      collaborators: undefined // Remove Map object
    },
    files: JSON.parse(JSON.stringify(scene.files))
  };
};

collabClient.sendSceneUpdate(pageId, cleanScene(sceneData));
```

---

## Troubleshooting

### Connection Fails

**Problem:** WebSocket connection doesn't establish

**Solutions:**
- Check backend server is running
- Verify WebSocket endpoint is correct
- Check browser console for CORS errors
- Ensure firewall allows WebSocket connections

### Messages Not Received

**Problem:** Not receiving updates from collaborators

**Solutions:**
- Verify `collabID` matches across clients
- Check sketch IDs have correct prefix (`${collabID}-...`)
- Ensure handlers are set before messages arrive
- Check browser console for filtering logs

### Updates Echo Back

**Problem:** Seeing own changes duplicated

**Solutions:**
- Implement echo suppression (see Best Practices)
- Verify server doesn't send to sender
- Check for duplicate state updates

### Data Not Serializing

**Problem:** `JSON.stringify()` fails or data corrupted

**Solutions:**
- Remove non-serializable objects (Maps, Sets, Functions)
- Deep clone scene data before sending
- Use `cleanSceneData` approach (see `sendSceneUpdate`)

---

## Related Documentation

- **[WebSocket API](../backend-api/websocket-api.md)** - Backend protocol specification
- **[App Component](components.md#app-component)** - How App uses CollabClient
- **[Types & Interfaces](types-and-interfaces.md)** - SceneData and related types
