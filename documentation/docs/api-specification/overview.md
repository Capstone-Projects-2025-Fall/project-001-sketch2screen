# API Overview

Sketch2Screen provides a REST API for AI-powered sketch-to-code generation and a WebSocket API for real-time collaboration.

## Quick Links

- **[API Reference](backend-api/swagger-api.mdx)** - Complete REST API and WebSocket endpoint specifications
- **[Internal Services](backend-api/services.md)** - Backend service architecture and implementation details
- **[Frontend Components](frontend-api/components.md)** - React component reference

## Architecture Overview

Sketch2Screen uses a client-server architecture with real-time collaboration:

```mermaid
graph TB
    subgraph Frontend["Frontend (React)"]
        Drawing["Drawing Canvas<br/>(Excalidraw)"]
        Mockup["Mockup Display<br/>(HTML Preview)"]
        Collab["Collaboration Client<br/>(WebSocket)"]
    end

    subgraph Backend["Backend (Django)"]
        RestViews["REST Views"]
        WSConsumer["WebSocket Consumer"]
        CollabServer["Collaboration Server"]
        ClaudeClient["Claude Client<br/>(Sketch Generation)"]
        ClaudeVariations["Claude Client Variations<br/>(Component Styling)"]
    end

    subgraph External["External Services"]
        AnthropicAPI["Anthropic Claude API"]
    end

    Drawing -->|"POST /api/generate/"| RestViews
    Drawing -->|"POST /api/generate-multi/"| RestViews
    Mockup -->|"POST /api/generate-variations/"| RestViews
    Collab <-->|"WebSocket /api/ws/collab/{id}/"| WSConsumer

    RestViews --> ClaudeClient
    RestViews --> ClaudeVariations
    WSConsumer --> CollabServer

    ClaudeClient -->|"CLAUDE_API_KEY"| AnthropicAPI
    ClaudeVariations -->|"CLAUDE_VARIATION_KEY"| AnthropicAPI
```

## API Categories

### REST API
Three HTTP endpoints for AI-powered generation:
- **`POST /api/generate/`** - Convert a single sketch image to HTML/Tailwind CSS
- **`POST /api/generate-multi/`** - Batch convert multiple sketches (up to 20 pages, parallel async)
- **`POST /api/generate-variations/`** - Generate design variations for selected UI components

### WebSocket API (Experimental)
Real-time collaboration over WebSocket:
- **Endpoint** - `ws://localhost:8000/ws/collab/{collabID}/`
- **Scene Sync** - Broadcast drawing changes using diffs to prevent mid-stroke conflicts
- **Page Management** - Synchronize page create/rename/delete operations
- **Collaborator Tracking** - Join/leave notifications and cursor position updates

See **[API Reference](backend-api/swagger-api.mdx)** for detailed request/response formats and protocol specifications.

### Internal Services
Backend services that power the API:
- **Claude Client** - Sketch-to-HTML generation using Anthropic's Claude (15k token limit)
- **Claude Client Variations** - Component variation generation (4k token limit)
- **Collaboration Server** - In-memory session and state management
- **WebSocket Consumer** - Real-time message routing

See **[Internal Services](backend-api/services.md)** for implementation details.

## Key Features

### Dual API Key Architecture
The backend uses two separate Anthropic API keys:
- **`CLAUDE_API_KEY`** - Main sketch-to-code generation (higher token usage)
- **`CLAUDE_VARIATION_KEY`** - Component variations (lower token usage)

This separation allows for better cost management and rate limit distribution.

### AI Model Configuration
- **Model**: `claude-haiku-4-5-20251001` (fast, cost-effective)
- **Max Tokens**: 15,000 (sketch generation), 4,000 (variations)
- **Input**: PNG images up to 10MB
- **Output**: Production-ready HTML with Tailwind CSS

### Security Model
- **Development Mode**: No authentication required
- **CSRF**: Disabled for API endpoints (`@csrf_exempt`)
- **CORS**: Enabled for cross-origin requests
- **File Validation**: Images only, 10MB limit
- **WebSocket**: Unauthenticated connections

**Production considerations:**
- Use `wss://` for WebSocket encryption
- Implement authentication and authorization
- Use Redis channel layer for horizontal scaling
- Add rate limiting for API endpoints

## Error Handling

All REST endpoints return JSON errors with `detail` field. Common HTTP status codes:
- `200` - Success
- `400` - Invalid request (missing fields, wrong type, invalid count)
- `413` - File too large (>10MB)
- `500` - AI generation failure or server error

WebSocket errors are logged server-side. Connection failures trigger automatic cleanup and session termination if last member.
