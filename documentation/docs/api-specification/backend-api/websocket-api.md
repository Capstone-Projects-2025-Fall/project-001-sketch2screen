# WebSocket API

Real-time collaboration protocol for synchronizing sketches across multiple connected clients.

## Overview

The WebSocket API enables real-time collaboration by allowing multiple users to work on the same sketch simultaneously. Changes are broadcast to all connected clients in the same collaboration session.

## Connection

### Endpoint

```
ws://localhost:8000/ws/collab/{collabID}/
```

**Path Parameters:**
- `collabID` (string/number) - Unique identifier for the collaboration session

### Connection Example

```javascript
const collabID = "12345"; // Can be numeric or string
const ws = new WebSocket(
  `ws://${window.location.hostname}:${window.location.port}/ws/collab/${collabID}/`
);

ws.onopen = () => {
  console.log('Connected to collaboration session:', collabID);
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from collaboration session');
};
```

### Connection Lifecycle

1. **Client connects** → Server calls `onNewConnection(userID, collabID)`
2. **Server sends existing sketches** → Client receives all current pages via `page_update` and `scene_update`
3. **Client sends updates** → Server broadcasts to other members
4. **Client disconnects** → Server calls `onConnectionEnd(userID, collabID)` and cleans up if last member

## Message Format

All messages are JSON objects with an `action` field indicating the message type.

### Client → Server Messages

Messages sent from the client to the server.

#### Scene Update

**Purpose:** Notify server of changes to drawing elements on a sketch page.

**Format:**
```json
{
  "action": "scene_update",
  "sketchID": "page-1",
  "sketchData": {
    "elements": [...],
    "appState": {...}
  }
}
```

**Fields:**
- `action` (string) - Must be `"scene_update"`
- `sketchID` (string/number) - ID of the sketch page being updated
- `sketchData` (object) - Excalidraw scene data containing elements and app state

**Example:**
```javascript
ws.send(JSON.stringify({
  action: "scene_update",
  sketchID: "page-1",
  sketchData: {
    elements: [
      { type: "rectangle", x: 10, y: 20, width: 100, height: 50 }
    ],
    appState: { viewBackgroundColor: "#ffffff" }
  }
}));
```

#### Page Update

**Purpose:** Notify server of page creation, rename, or deletion operations.

**Format:**
```json
{
  "action": "page_update",
  "sketchID": "page-2",
  "pageName": "About Us"
}
```

**Fields:**
- `action` (string) - Must be `"page_update"`
- `sketchID` (string/number) - ID of the sketch page
- `pageName` (string | null) - New name for the page, or `null` to delete

**Examples:**

**Create/Rename Page:**
```javascript
// Create new page or rename existing
ws.send(JSON.stringify({
  action: "page_update",
  sketchID: "page-2",
  pageName: "Contact Page"
}));
```

**Delete Page:**
```javascript
// Delete page by sending null name
ws.send(JSON.stringify({
  action: "page_update",
  sketchID: "page-2",
  pageName: null
}));
```

---

### Server → Client Messages

Messages received from the server (broadcast to other clients).

#### Scene Update

**Purpose:** Notify client that another user has updated a sketch's drawing content.

**Format:**
```json
{
  "action": "scene_update",
  "sketchID": "page-1",
  "sketchData": {
    "elements": [...],
    "appState": {...}
  }
}
```

**Fields:**
- `action` (string) - Always `"scene_update"`
- `sketchID` (string/number) - ID of the updated sketch
- `sketchData` (object) - The updated scene data

**Handling:**
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.action === "scene_update") {
    updateLocalScene(message.sketchID, message.sketchData);
  }
};
```

#### Page Update

**Purpose:** Notify client that another user has created, renamed, or deleted a page.

**Format:**
```json
{
  "action": "page_update",
  "sketchID": "page-3",
  "pageName": "New Page"
}
```

**Fields:**
- `action` (string) - Always `"page_update"`
- `sketchID` (string/number) - ID of the affected page
- `pageName` (string | null) - New name, or `null` if page was deleted

**Handling:**
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.action === "page_update") {
    if (message.pageName === null) {
      // Page was deleted
      deletePage(message.sketchID);
    } else {
      // Page was created or renamed
      createOrRenamePage(message.sketchID, message.pageName);
    }
  }
};
```

## Collaboration Sessions

### Session Management

- Each `collabID` represents a unique collaboration session
- Sessions are created automatically when the first user connects
- Sessions are destroyed when the last user disconnects
- All session data is **in-memory** (lost on server restart)

### Session State

Each session maintains:
- **Members list** - Array of connected user channel names
- **Sketches list** - Array of sketch objects with:
  - `ID` - Unique identifier
  - `name` - Display name
  - `sceneData` - Current drawing state

### User Identification

Users are identified by their **channel name** (assigned by Django Channels):
- Unique per WebSocket connection
- Automatically generated (e.g., `"specific.channel.abcd1234"`)
- Used internally by the server
- Not exposed to clients

## Complete Integration Example

### CollabClient Class

```javascript
class CollabClient {
  constructor(collabID) {
    this.collabID = collabID;
    this.connection = new WebSocket(
      `ws://${window.location.hostname}:${window.location.port}/ws/collab/${collabID}/`
    );

    this.connection.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.action === "scene_update") {
        this.handleSceneUpdate?.(message.sketchID, message.sketchData);
      } else if (message.action === "page_update") {
        this.handlePageUpdate?.(message.sketchID, message.pageName);
      }
    };
  }

  setUpdateHandler(handler) {
    this.handleSceneUpdate = handler;
  }

  setPageUpdateHandler(handler) {
    this.handlePageUpdate = handler;
  }

  sendSceneUpdate(sketchID, sceneData) {
    // Remove non-serializable objects
    const serializedData = {
      elements: sceneData.elements,
      appState: sceneData.appState
    };

    this.connection.send(JSON.stringify({
      action: "scene_update",
      sketchID: sketchID,
      sketchData: serializedData
    }));
  }

  sendPageUpdate(sketchID, name) {
    this.connection.send(JSON.stringify({
      action: "page_update",
      sketchID: sketchID,
      pageName: name
    }));
  }

  disconnect() {
    this.connection.close();
  }
}
```

### Using CollabClient in React

```javascript
function App() {
  const [collabClient, setCollabClient] = useState(null);
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);

  // Initialize collaboration
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const collabID = urlParams.get('collab') || Date.now();

    const client = new CollabClient(collabID);

    // Handle incoming scene updates
    client.setUpdateHandler((sketchID, sceneData) => {
      setPages(prev => prev.map(page =>
        page.id === sketchID
          ? { ...page, sceneData }
          : page
      ));
    });

    // Handle incoming page updates
    client.setPageUpdateHandler((sketchID, pageName) => {
      if (pageName === null) {
        // Delete page
        setPages(prev => prev.filter(p => p.id !== sketchID));
      } else {
        // Create or rename page
        setPages(prev => {
          const existing = prev.find(p => p.id === sketchID);
          if (existing) {
            // Rename
            return prev.map(p =>
              p.id === sketchID ? { ...p, name: pageName } : p
            );
          } else {
            // Create
            return [...prev, { id: sketchID, name: pageName, sceneData: {} }];
          }
        });
      }
    });

    setCollabClient(client);

    return () => client.disconnect();
  }, []);

  // Send local changes
  const handleSceneChange = (sceneData) => {
    // Update local state
    setPages(prev => prev.map(page =>
      page.id === activePageId
        ? { ...page, sceneData }
        : page
    ));

    // Broadcast to other clients
    collabClient?.sendSceneUpdate(activePageId, sceneData);
  };

  const handlePageRename = (pageId, newName) => {
    setPages(prev => prev.map(p =>
      p.id === pageId ? { ...p, name: newName } : p
    ));

    collabClient?.sendPageUpdate(pageId, newName);
  };

  const handlePageDelete = (pageId) => {
    setPages(prev => prev.filter(p => p.id !== pageId));
    collabClient?.sendPageUpdate(pageId, null);
  };

  // ... rest of component
}
```

## Best Practices

### Avoid Echo

**Problem:** Client receives its own updates back from the server.

**Solution:** Track local changes and ignore matching updates.

```javascript
const suppressRemoteUpdate = useRef(false);

const handleSceneChange = (sceneData) => {
  suppressRemoteUpdate.current = true;
  setPages(prev => /* update */);
  collabClient?.sendSceneUpdate(activePageId, sceneData);

  setTimeout(() => {
    suppressRemoteUpdate.current = false;
  }, 100);
};

client.setUpdateHandler((sketchID, sceneData) => {
  if (suppressRemoteUpdate.current) return;
  setPages(prev => /* update */);
});
```

### Debounce Scene Updates

**Problem:** Sending updates on every stroke floods the network.

**Solution:** Debounce updates during active drawing.

```javascript
const updateTimerRef = useRef(null);

const handleSceneChange = (sceneData) => {
  // Update local state immediately
  setLocalScene(sceneData);

  // Debounce network send
  clearTimeout(updateTimerRef.current);
  updateTimerRef.current = setTimeout(() => {
    collabClient?.sendSceneUpdate(activePageId, sceneData);
  }, 500);
};
```

### Serialize Data Properly

**Problem:** Excalidraw scene includes non-serializable objects (Maps, Sets).

**Solution:** Extract only serializable fields.

```javascript
const serializeScene = (sceneData) => {
  return {
    elements: sceneData.elements || [],
    appState: {
      viewBackgroundColor: sceneData.appState?.viewBackgroundColor,
      // ... other serializable fields
    }
  };
};

collabClient.sendSceneUpdate(pageId, serializeScene(sceneData));
```

### Handle Connection Failures

```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  showNotification('Connection lost. Retrying...');
};

ws.onclose = (event) => {
  if (!event.wasClean) {
    // Reconnect after 2 seconds
    setTimeout(() => {
      initializeCollaboration(collabID);
    }, 2000);
  }
};
```

## Server Implementation Details

For reference, here's how the server processes messages:

### Scene Update Flow

1. Client sends `scene_update` message
2. `SketchConsumer.receive()` parses JSON
3. Calls `CollabServer.onSceneUpdate(userID, collabID, sketchID, sceneData)`
4. Server updates stored sketch data
5. Server broadcasts to all members **except sender**
6. Each member receives message via `SketchConsumer.scene_update()`

### Page Update Flow

1. Client sends `page_update` message with `pageName`
2. Server checks if sketch exists:
   - **If not found:** Creates new sketch with empty scene
   - **If `pageName` is `null`:** Deletes sketch
   - **Otherwise:** Updates sketch name
3. Server broadcasts to all members **except sender**

## Limitations

- **No persistence** - All data lost on server restart
- **No authentication** - Anyone with `collabID` can join
- **No encryption** - Messages sent in plain text (use `wss://` in production)
- **No conflict resolution** - Last write wins
- **In-memory channel layer** - Won't scale horizontally (use Redis for production)

## Related Documentation

- **[REST API Endpoints](rest-endpoints.md)** - HTTP API for mockup generation
- **[Internal Services](services.md)** - CollabServer implementation details
- **[Frontend CollabClient](../frontend-api/collaboration-client.md)** - Client implementation
