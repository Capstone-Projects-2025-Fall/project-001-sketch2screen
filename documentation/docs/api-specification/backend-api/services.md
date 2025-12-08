# Internal Services

Backend service architecture and implementation details for Sketch2Screen.

## Overview

The backend consists of three main service components:

1. **Claude Client** - AI-powered sketch-to-code generation
2. **Collaboration Server** - Real-time session and state management
3. **WebSocket Consumer** - WebSocket message handling

---

## Claude Client Service

**Module:** `backend/sketch_api/services/claudeClient.py`

The Claude Client service handles all interactions with the Anthropic Claude API for AI-powered sketch-to-code generation.

### Functions

#### `image_to_html_css()`

**Purpose:** Main entry point for converting sketch images to HTML/CSS using Claude AI.

**Signature:**
```python
async def image_to_html_css(
    image_bytes: bytes,
    media_type: str = "image/png",
    prompt: Optional[str] = None
) -> str
```

**Note:** This is an **async function** and must be awaited.

**Parameters:**
- `image_bytes` (bytes) - Raw binary data of the image file
- `media_type` (str, optional) - MIME type of the image (default: `"image/png"`)
- `prompt` (str | None, optional) - Custom user instruction for code generation (default: `None`)

**Returns:**
- `str` - Generated HTML and CSS code

**Raises:**
- `RuntimeError` - If API key is missing or Claude returns no text
- `FileNotFoundError` - If API key file path is invalid

**Example:**
```python
from sketch_api.services.claudeClient import image_to_html_css
import asyncio

# Read image file
with open('sketch.png', 'rb') as f:
    image_bytes = f.read()

# Generate HTML/CSS (must await)
html = await image_to_html_css(
    image_bytes=image_bytes,
    media_type="image/png",
    prompt="Make this design responsive"
)

print(html)
```

**How It Works:**

1. **Base64 Encoding** - Converts image bytes to base64 string
2. **Prompt Construction** - Combines system message with user instruction
3. **API Call** - Sends image + prompt to Claude via Anthropic SDK
4. **Response Parsing** - Extracts text content from Claude response
5. **Validation** - Ensures response is not empty

**System Prompt:**
```
You are an expert frontend developer specializing in converting UI sketches into
modern, high-fidelity, pixel-perfect, production-ready HTML with Tailwind CSS. Your code is clean, semantic,
accessible, and follows modern web development best practices.
```

**Default User Instruction:**
```
Convert the provided UI sketch into complete, functional HTML with Tailwind CSS styling.

CRITICAL OUTPUT REQUIREMENTS:
- Ignore the outer bounding box of sketch as it is for user to assume as a viewport.
- Return ONLY raw HTML code - no markdown fences, no explanations, no preamble
- This renders in an iframe, so include complete document structure with <!DOCTYPE html>
- Set body to full viewport dimensions: class="h-screen w-screen" (100vh height, 100vw width)
- Do not add padding to outside of the borders, only use spacing within the layout itself
- Ensure the color scheme matches the sketch.

CODE QUALITY STANDARDS:
- Design generated should be of extremely high fidelity.
- Use semantic HTML5 elements (<header>, <nav>, <main>, <section>, <article>, <footer>)
- Include all necessary JavaScript for interactivity (e.g., dropdowns, modals, tabs)
- Minimize unnecessary wrapper divs - keep markup lean
- Ensure all elements have explicit dimensions or content to render properly
- Make layouts responsive using Tailwind's responsive prefixes (sm:, md:, lg:)
- The design should look production-ready, not like a prototype

DESIGN FIDELITY:
- Match the sketch's layout and color scheme but make it modern, clean, and visually appealing
- If elements are labeled with HTML tag names (e.g., "button", "input", "img"), use those exact tags
- Preserve all text content visible in the sketch
- For images in the design: Use placeholder divs or external placeholder images
- Represent icons using emoji, Unicode symbols, or labeled boxes

Begin your response with <!DOCTYPE html> and nothing else.
```

**Configuration:**
- **Model:** `claude-haiku-4-5-20251001` (configurable via `CLAUDE_MODEL` setting)
- **Max Tokens:** 15000
- **API Key:** Loaded from file or environment variable

---

#### `_client()`

**Purpose:** Internal helper to create authenticated Anthropic client.

**Signature:**
```python
def _client() -> AsyncAnthropic
```

**Returns:**
- `AsyncAnthropic` - Authenticated async API client instance

**Raises:**
- `RuntimeError` - If API key is not configured

**API Key Loading Strategy:**
1. Try to load from file specified in `CLAUDE_API_KEY` setting
2. If file fails, try `ANTHROPIC_API_KEY` environment variable
3. If both fail, raise `RuntimeError`

**Example:**
```python
client = _client()
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1000,
    messages=[...]
)
```

---

#### `_load_anthropic_key_from_file()`

**Purpose:** Internal helper to read API key from file.

**Signature:**
```python
def _load_anthropic_key_from_file() -> str
```

**Returns:**
- `str` - API key (whitespace trimmed)

**Raises:**
- `RuntimeError` - If `CLAUDE_API_KEY` setting is not configured
- `RuntimeError` - If API key file is empty
- `FileNotFoundError` - If file path doesn't exist
- `PermissionError` - If file cannot be read

**Example Django Settings:**
```python
# settings.py
CLAUDE_API_KEY = "/path/to/api_key.txt"
```

---

#### `_extract_text()`

**Purpose:** Internal helper to extract text from Claude API response.

**Signature:**
```python
def _extract_text(resp) -> str
```

**Parameters:**
- `resp` (Message) - Anthropic API response object

**Returns:**
- `str` - Concatenated text from all text-type content blocks

**Example Response Structure:**
```python
# Claude response object
{
    "content": [
        {"type": "text", "text": "<div>HTML code here</div>"},
        {"type": "text", "text": "<style>CSS here</style>"}
    ]
}

# Extracted result
"<div>HTML code here</div><style>CSS here</style>"
```

---

## Collaboration Server

**Module:** `backend/sketch_api/CollabServer.py`

The Collaboration Server manages real-time collaboration sessions using the Singleton pattern.

### Architecture

```
┌─────────────────────────────────────────────────┐
│           CollabServer (Singleton)              │
├─────────────────────────────────────────────────┤
│  collabSessions: {                              │
│    "12345": CollabSession {                     │
│      members: ["user1", "user2", "user3"]       │
│      sketches: [                                │
│        Sketch { ID, name, sceneData }           │
│      ]                                          │
│    }                                            │
│  }                                              │
└─────────────────────────────────────────────────┘
```

### Functions

#### `applyDiff(base, diff)`

**Purpose:** Apply a differential update to a base scene object, merging changes recursively.

**Signature:**
```python
def applyDiff(base, diff)
```

**Parameters:**
- `base` (dict | list | any) - The base scene data to apply changes to
- `diff` (dict | list | any) - The differential changes to apply

**Returns:**
- `dict | list | any` - Merged result with diff applied to base

**How It Works:**
1. Converts lists to dicts with string indices for uniform processing
2. Recursively merges diff into base
3. Preserves base values not mentioned in diff
4. Adds new keys from diff not in base
5. Converts back to list if original was list

**Example:**
```python
base = {"elements": [{"id": "1", "x": 10}], "appState": {"zoom": 1}}
diff = {"elements": {"0": {"x": 20}}}  # Update x coordinate of first element

result = applyDiff(base, diff)
# Result: {"elements": [{"id": "1", "x": 20}], "appState": {"zoom": 1}}
```

**Use Case:**
- Efficiently synchronize scene changes without sending entire scene
- Reduces network payload for collaboration updates
- Prevents mid-stroke conflicts by only sending deltas

---

### Classes

#### `Collaborator`

**Purpose:** Represents a user participating in a collaboration session.

**Constructor:**
```python
def __init__(self, userID, username, channelName):
    self.userID = userID
    self.username = username
    self.channelName = channelName
    self.pointer = None
    self.currentPage = None
```

**Attributes:**
- `userID` (str) - Client-generated unique identifier
- `username` (str) - Display name for this user
- `channelName` (str) - Django Channels WebSocket identifier (internal)
- `pointer` (dict | None) - Current cursor position `{x, y}` or `None`
- `currentPage` (str | None) - ID of the page user is currently viewing

**Example:**
```python
collaborator = Collaborator(
    userID="user-1234567890-abc123",
    username="Alice",
    channelName="specific.channel.xyz789"
)
collaborator.pointer = {"x": 150, "y": 200}
collaborator.currentPage = "page-1"
```

---

#### `SingletonMeta`

**Purpose:** Metaclass that implements the Singleton design pattern.

**Usage:**
```python
class MyClass(metaclass=SingletonMeta):
    pass

instance1 = MyClass()
instance2 = MyClass()

assert instance1 is instance2  # True - same instance
```

**Implementation:**
```python
class SingletonMeta(type):
    _instance = None

    def __call__(cls, *args, **kwargs):
        if cls._instance == None:
            cls._instance = super(SingletonMeta, cls).__call__(*args, **kwargs)
        return cls._instance
```

---

#### `CollabSession`

**Purpose:** Represents a single collaboration session.

**Attributes:**
- `members` (list[str]) - List of connected user channel names
- `sketches` (list[Sketch]) - List of sketch objects in this session

**Example:**
```python
session = CollabSession()
session.members = ["specific.channel.abc123", "specific.channel.def456"]
session.sketches = [
    Sketch("Homepage", "page-1", {...}),
    Sketch("About", "page-2", {...})
]
```

---

#### `Sketch`

**Purpose:** Represents a single sketch/page within a collaboration session.

**Constructor:**
```python
def __init__(self, name, ID, sceneData):
    self.name = name
    self.ID = ID
    self.sceneData = sceneData
```

**Attributes:**
- `name` (str) - Display name of the sketch page
- `ID` (str | int) - Unique identifier for the sketch
- `sceneData` (dict) - Excalidraw scene data (elements, appState, etc.)

**Example:**
```python
sketch = Sketch(
    name="Contact Page",
    ID="page-3",
    sceneData={
        "elements": [...],
        "appState": {...}
    }
)
```

---

#### `CollabServer`

**Purpose:** Singleton server managing all collaboration sessions and message routing.

**Metaclass:** `SingletonMeta`

**Attributes:**
- `collabSessions` (dict) - Maps `collabID` → `CollabSession`

**Methods:**

##### `onNewConnection(userID, collabID)`

**Purpose:** Handle new user connecting to a collaboration session.

**Parameters:**
- `userID` (str) - Channel name of the connecting user
- `collabID` (str) - Collaboration session ID

**Behavior:**
1. Creates new session if it doesn't exist
2. Adds user to session members list
3. Sends all existing sketches to the new user

**Example:**
```python
server = CollabServer()
server.onNewConnection("specific.channel.abc123", "12345")
```

---

##### `onSceneUpdate(userID, collabID, sketchID, sceneData)`

**Purpose:** Handle scene update from a user.

**Parameters:**
- `userID` (str) - Channel name of the user sending update
- `collabID` (str) - Collaboration session ID
- `sketchID` (str) - ID of the sketch being updated
- `sceneData` (dict) - New scene data

**Behavior:**
1. Validates sketch exists in session (discards if not found)
2. Updates stored scene data
3. Broadcasts update to all members **except sender**

**Example:**
```python
server.onSceneUpdate(
    userID="specific.channel.abc123",
    collabID="12345",
    sketchID="page-1",
    sceneData={"elements": [...], "appState": {...}}
)
```

---

##### `onPageUpdate(userID, collabID, sketchID, pageName)`

**Purpose:** Handle page create, rename, or delete operation.

**Parameters:**
- `userID` (str) - Channel name of the user sending update
- `collabID` (str) - Collaboration session ID
- `sketchID` (str) - ID of the sketch page
- `pageName` (str | None) - New name, or `None` to delete

**Behavior:**
- **If sketch not found:** Creates new sketch with empty scene data
- **If `pageName` is `None`:** Deletes sketch from session
- **Otherwise:** Updates sketch name

**Example:**
```python
# Create/rename page
server.onPageUpdate("user1", "12345", "page-2", "About Us")

# Delete page
server.onPageUpdate("user1", "12345", "page-2", None)
```

---

##### `onConnectionEnd(userID, collabID)`

**Purpose:** Handle user disconnecting from session.

**Parameters:**
- `userID` (str) - Channel name of the disconnecting user
- `collabID` (str) - Collaboration session ID

**Behavior:**
1. Removes user from session members list
2. If session has no remaining members, deletes the entire session

**Example:**
```python
server.onConnectionEnd("specific.channel.abc123", "12345")
```

---

##### `sendSceneUpdate(userID, sketchID, sceneData)`

**Purpose:** Send scene update message to a specific user via Django Channels.

**Parameters:**
- `userID` (str) - Target user channel name
- `sketchID` (str) - ID of the updated sketch
- `sceneData` (dict) - Updated scene data

**Example:**
```python
server.sendSceneUpdate(
    userID="specific.channel.def456",
    sketchID="page-1",
    sceneData={"elements": [...]}
)
```

**Internally uses:**
```python
async_to_sync(get_channel_layer().send)(userID, {
    "type": "scene.update",
    "sketchID": sketchID,
    "sketchData": sceneData
})
```

---

##### `sendPageUpdate(userID, sketchID, pageName)`

**Purpose:** Send page update message to a specific user.

**Parameters:**
- `userID` (str) - Target user channel name
- `sketchID` (str) - ID of the updated sketch
- `pageName` (str | None) - New name or `None` for deletion

**Example:**
```python
server.sendPageUpdate(
    userID="specific.channel.def456",
    sketchID="page-2",
    pageName="Contact"
)
```

---

## WebSocket Consumer

**Module:** `backend/sketch_api/consumers.py`

Handles WebSocket connections and routes messages to CollabServer.

**WebSocket Endpoint:** `ws://localhost:8000/ws/collab/{collabID}/`

**Note:** This is an experimental feature and may have bugs.

### Class: `SketchConsumer`

**Inherits:** `channels.generic.websocket.WebsocketConsumer`

**Attributes:**
- `server` (CollabServer) - Singleton instance (class variable)
- `collabID` (str) - Collaboration ID for this connection (instance variable)

### WebSocket Protocol

**Connection Lifecycle:**
1. Client connects → Server calls `onNewConnection(channelName, collabID)`
2. Server sends existing state → Client receives all current pages via `page_update` and `scene_update`, plus existing collaborators via `collaborator_join`
3. Client sends `collaborator_join` → Server broadcasts new user to others
4. Client sends updates → Server broadcasts scene diffs to other members (excluding sender)
5. Client disconnects → Server calls `onConnectionEnd(channelName, collabID)`, sends `collaborator_leave` to others, and cleans up if last member

**Message Types (Client → Server):**
- `scene_update` - Scene drawing changes (with diff for efficiency)
- `page_update` - Page create/rename/delete (null name = delete)
- `collaborator_join` - User joined with userID and username
- `collaborator_pointer` - Cursor position update (throttled to 50ms, includes pageID)

**Message Types (Server → Client):**
- `scene_update` - Another user's drawing changes
- `page_update` - Another user's page operations
- `collaborator_join` - New user joined the session
- `collaborator_leave` - User disconnected
- `collaborator_pointer` - Another user's cursor moved (filtered by pageID)

### Key Methods

#### `connect()`
Extracts `collabID` from URL route, calls `server.onNewConnection()`, accepts WebSocket connection.

#### `disconnect(close_code)`
Calls `server.onConnectionEnd()` to clean up session.

#### `receive(text_data)`
Parses JSON message, routes based on `action` field to:
- `scene_update` → `onSceneUpdate()`
- `page_update` → `onPageUpdate()`
- `collaborator_join` → `onCollaboratorJoin()`
- `collaborator_pointer` → `onCollaboratorPointer()`

#### `scene_update(event)`, `page_update(event)`, `collaborator_join(event)`, `collaborator_leave(event)`, `collaborator_pointer(event)`
Django Channels handlers that serialize events and send to WebSocket client.

**Example Message Flow:**
```python
# Client sends
{"action": "scene_update", "sketchID": "page-1", "sketchData": {...}}

# Server broadcasts to others
{"action": "scene_update", "sketchID": "page-1", "sketchData": {...}}
```

---

## Configuration

### Django Settings

**Required:**
```python
# settings.py

# Claude API key file path or use ANTHROPIC_API_KEY env var
CLAUDE_API_KEY = "/path/to/api_key.txt"

# Optional: Claude model to use (default shown)
CLAUDE_MODEL = "claude-sonnet-4-20250514"

# Channel layers for WebSocket
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}
```

**Environment Variables:**
```bash
# Alternative to CLAUDE_API_KEY setting
export ANTHROPIC_API_KEY="sk-ant-..."

# Set to True for production mode
export PROD=True
```

---

## Performance Considerations

### Claude Client
- **Synchronous API calls** - Blocks request thread during generation
- **Average response time:** 3-10 seconds per image
- **Token limit:** 2000 tokens per response
- **Rate limits:** Depends on Anthropic API plan

**Optimization Ideas:**
- Use async/await for non-blocking requests
- Implement request queuing for high traffic
- Cache common sketch patterns

### Collaboration Server
- **In-memory storage** - Fast but ephemeral
- **No persistence** - All data lost on restart
- **Single-instance limitation** - InMemoryChannelLayer doesn't scale horizontally

**Scaling Recommendations:**
- Use Redis channel layer for multi-server deployments
- Implement database persistence for sketches
- Add session expiration and cleanup

### WebSocket Consumer
- **One consumer instance per connection**
- **Message broadcasting** - O(n) where n = number of session members
- **No message buffering** - Messages sent immediately
