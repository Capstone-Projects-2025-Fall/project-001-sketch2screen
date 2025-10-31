# API Overview

This section provides complete reference documentation for both the backend API and frontend components.

## Quick Links

- **[REST API Endpoints](backend-api/rest-endpoints.md)** - HTTP endpoints for sketch generation
- **[WebSocket API](backend-api/websocket-api.md)** - Real-time collaboration protocol
- **[Internal Services](backend-api/services.md)** - Backend service architecture
- **[Frontend Components](frontend-api/components.md)** - React component reference

## Architecture Overview

Sketch2Screen uses a client-server architecture with real-time collaboration:

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐    │
│  │  Drawing   │  │   Mockup   │  │  Collaboration      │    │
│  │  Canvas    │  │  Display   │  │  Client (WebSocket) │    │
│  └────────────┘  └────────────┘  └─────────────────────┘    │
└────────────┬─────────────┬─────────────────┬────────────────┘
             │             │                 │
             │ HTTP POST   │ HTTP POST       │ WebSocket (ws://)
             │ /generate/  │ /generate-multi/│ /ws/collab/{id}/
             │             │                 │
┌────────────┴─────────────┴─────────────────┴────────────────┐
│                       Backend (Django)                      │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ REST Views   │  │ WebSocket       │  │ Collaboration  │  │
│  │ (Generate)   │  │ Consumer        │  │ Server         │  │
│  └──────┬───────┘  └────────┬────────┘  └────────────────┘  │
│         │                   │                               │
│         │            ┌──────┴────────┐                      │
│         └──────────▶ │ Claude Client │                      │
│                      │ (AI Service)  │                      │
│                      └───────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Anthropic Claude API
```

## API Categories

### REST API
HTTP endpoints for sketch-to-code generation:
- **Single Generation** - Convert one sketch image to HTML/CSS
- **Multi-page Generation** - Convert multiple sketches in batch
- **Health Check** - Verify backend connectivity

### WebSocket API
Real-time collaboration protocol:
- **Connection Management** - Join/leave collaboration sessions
- **Scene Updates** - Synchronize drawing changes across clients
- **Page Updates** - Synchronize page create/rename/delete operations

### Internal Services
Backend services that power the API:
- **Claude Client** - AI-powered sketch-to-code generation
- **Collaboration Server** - Session and state management
- **WebSocket Consumer** - Real-time message handling

## Common Workflows

### Generate Mockup from Sketch

```javascript
// 1. Export sketch to PNG blob
const blob = await drawingRef.current?.exportToBlob();

// 2. Upload to backend
const formData = new FormData();
formData.append('file', blob, 'sketch.png');

const response = await fetch('/api/generate/', {
  method: 'POST',
  body: formData
});

// 3. Get generated HTML
const { html } = await response.json();
```

### Multi-page Generation

```javascript
// 1. Collect all sketch pages
const formData = new FormData();
formData.append('count', pages.length.toString());

pages.forEach((page, index) => {
  const blob = await exportPageToBlob(page);
  formData.append(`file_${index}`, blob);
  formData.append(`name_${index}`, page.name);
  formData.append(`id_${index}`, page.id);
});

// 2. Generate all mockups in parallel
const response = await fetch('/api/generate-multi/', {
  method: 'POST',
  body: formData
});

const { results } = await response.json();
// results = [{ id: 'page-1', html: '...' }, ...]
```

### Real-time Collaboration

```javascript
// 1. Create collaboration client
const collabClient = new CollabClient(collabID);

// 2. Set up handlers
collabClient.setUpdateHandler((sketchID, sceneData) => {
  // Update local scene with remote changes
  updateScene(sketchID, sceneData);
});

// 3. Send updates when local changes occur
const handleSceneChange = (sceneData) => {
  collabClient.sendSceneUpdate(activePageId, sceneData);
};
```

## Authentication & Security

**Current Status:** No authentication required (development mode)

**Security Considerations:**
- CSRF protection is disabled for API endpoints (`@csrf_exempt`)
- CORS is enabled for cross-origin requests
- File uploads are limited to 10MB per file
- Only image files are accepted (`image/*` content types)
- WebSocket connections are unauthenticated

**Production Recommendations:**
- Implement user authentication (JWT, OAuth, etc.)
- Enable CSRF protection with token validation
- Restrict CORS to specific origins
- Add rate limiting to prevent abuse
- Implement WebSocket authentication/authorization

## Error Handling

All endpoints follow consistent error response formats:

**REST API Errors:**
```json
{
  "detail": "Error message describing what went wrong"
}
```

**HTTP Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid input (missing file, wrong type, etc.)
- `413 Request Entity Too Large` - File exceeds 10MB limit
- `500 Internal Server Error` - AI generation failed or server error

**WebSocket Errors:**
WebSocket errors are logged server-side. Invalid messages are silently discarded.

## Configuration

**Backend Settings:**
- `CLAUDE_API_KEY` - Path to file containing Anthropic API key (or `ANTHROPIC_API_KEY` env var)
- `CLAUDE_MODEL` - Claude model to use (default: `claude-sonnet-4-20250514`)
- `MAX_BYTES` - Maximum upload size (10MB)

**Environment Variables:**
- `ANTHROPIC_API_KEY` - Claude API key (alternative to file-based config)
- `PROD` - Set to `True` for production mode

## Rate Limits

**Current Implementation:** No rate limiting

**Anthropic API Limits:**
- Requests per minute vary by plan
- Token limits apply (max_tokens=2000 per request)
- See [Anthropic documentation](https://docs.anthropic.com/en/api/rate-limits) for details

## Next Steps

- **[REST API Documentation](backend-api/rest-endpoints.md)** - Detailed endpoint reference
- **[WebSocket Protocol](backend-api/websocket-api.md)** - Real-time collaboration protocol
- **[Frontend Components](frontend-api/components.md)** - React component API
