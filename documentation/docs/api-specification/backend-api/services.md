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
def image_to_html_css(
    image_bytes: bytes,
    media_type: str = "image/png",
    prompt: Optional[str] = None
) -> str
```

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

# Read image file
with open('sketch.png', 'rb') as f:
    image_bytes = f.read()

# Generate HTML/CSS
html = image_to_html_css(
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
You are a frontend assistant that converts UI sketches into high-fidelity,
clean, production-ready HTML and CSS. Prefer semantic HTML, minimal wrappers,
inline styles for each of the components of the image. Do not use body tag.
Use modern CSS if possible. Use Bootstrap or Tailwind CSS only. Do not
include markdown fences in the code.
```

**Default User Instruction:**
```
Generate HTML and CSS that recreates the layout in the image. Only provide
the code, no other text including markdown fences. If an element is labeled
as an HTML tag it should be that HTML tag. If there is text in the image,
it should be included in the HTML. Any icons or images in the sketch should
be represented by placeholders. All sketches generated should be width 100
percent and height 100 percent.
```

**Configuration:**
- **Model:** `claude-sonnet-4-20250514` (configurable via `CLAUDE_MODEL` setting)
- **Max Tokens:** 2000
- **API Key:** Loaded from file or environment variable

---

#### `_client()`

**Purpose:** Internal helper to create authenticated Anthropic client.

**Signature:**
```python
def _client() -> Anthropic
```

**Returns:**
- `Anthropic` - Authenticated API client instance

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

### Classes

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

### Class: `SketchConsumer`

**Inherits:** `channels.generic.websocket.WebsocketConsumer`

**Attributes:**
- `server` (CollabServer) - Singleton instance (class variable)
- `collabID` (str) - Collaboration ID for this connection (instance variable)

#### Methods

##### `connect()`

**Purpose:** Called when WebSocket connection is established.

**Behavior:**
1. Extracts `collabID` from URL route
2. Calls `server.onNewConnection()`
3. Accepts the WebSocket connection

**Example URL:** `ws://localhost:8000/ws/collab/12345/`
- `collabID` = `"12345"`

---

##### `disconnect(close_code)`

**Purpose:** Called when WebSocket connection is closed.

**Parameters:**
- `close_code` (int) - WebSocket close code

**Behavior:**
- Calls `server.onConnectionEnd()` to clean up session

---

##### `receive(text_data)`

**Purpose:** Called when a message is received from the client.

**Parameters:**
- `text_data` (str) - JSON string from client

**Behavior:**
1. Parses JSON message
2. Checks `action` field
3. Routes to appropriate server method:
   - `"scene_update"` → `onSceneUpdate()`
   - `"page_update"` → `onPageUpdate()`

**Example:**
```python
def receive(self, text_data):
    message = json.loads(text_data)
    action = message["action"]

    if action == "scene_update":
        self.server.onSceneUpdate(
            self.channel_name,
            self.collabID,
            message["sketchID"],
            message["sketchData"]
        )
```

---

##### `scene_update(event)`

**Purpose:** Called by Django Channels to send scene update to this client.

**Parameters:**
- `event` (dict) - Event data from channel layer

**Behavior:**
- Serializes event as JSON
- Sends to WebSocket client

**Example Event:**
```python
{
    "type": "scene.update",
    "sketchID": "page-1",
    "sketchData": {...}
}
```

**Sent to client as:**
```json
{
    "action": "scene_update",
    "sketchID": "page-1",
    "sketchData": {...}
}
```

---

##### `page_update(event)`

**Purpose:** Called by Django Channels to send page update to this client.

**Parameters:**
- `event` (dict) - Event data from channel layer

**Behavior:**
- Serializes event as JSON
- Sends to WebSocket client

**Example Event:**
```python
{
    "type": "page.update",
    "sketchID": "page-2",
    "pageName": "About"
}
```

**Sent to client as:**
```json
{
    "action": "page_update",
    "sketchID": "page-2",
    "pageName": "About"
}
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

---

## Error Handling

### Claude Client Errors

```python
try:
    html = image_to_html_css(image_bytes)
except RuntimeError as e:
    # API key missing or empty response
    logger.error(f"Claude client error: {e}")
except FileNotFoundError:
    # API key file not found
    logger.error("Claude API key file not found")
except Exception as e:
    # Network errors, API errors, etc.
    logger.error(f"Unexpected error: {e}")
```

### Collaboration Server Errors

The CollabServer currently has minimal error handling:
- Invalid sketch IDs are silently discarded
- Missing sessions are created automatically
- No validation of scene data structure

**Production Recommendations:**
- Add schema validation for scene data
- Implement error responses to clients
- Add logging for debugging

---


## Related Documentation

- **[API reference](swagger-api.mdx)** - Backend API request endpoints
- **[Frontend Components](../frontend-api/components.md)** - How frontend uses these services
