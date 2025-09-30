---
sidebar_position: 2
---

# System Block Diagram

```mermaid
flowchart LR
    Users[Users/Collaborators]

    subgraph Frontend[React Frontend]
        Canvas[Drawing Canvas]
        Design[Design Interface]
    end

    subgraph Backend[Django Backend]
        API[REST API Server]
        WS[WebSocket Server]
    end
    
    AI[AI Model API<br/>Anthropic Claude]
    DB[(Database<br/>SQLite)]

    Users -->|Draw & Collaborate| Frontend
    Frontend -->|HTTP Requests| API
    Frontend <-->|Real-time Sync| WS
    API -->|Generate Components| AI
    AI -->|Component Designs| API
    API <-->|Store/Retrieve| DB
    WS <-->|Workspace State| DB
    API -->|Generated Code| Frontend
    Frontend -->|Download Code| Users

    classDef userStyle fill:#4fc3f7,stroke:#0277bd,stroke-width:2px
    classDef frontendStyle fill:#ffb74d,stroke:#e65100,stroke-width:2px
    classDef backendStyle fill:#ba68c8,stroke:#6a1b9a,stroke-width:2px
    classDef externalStyle fill:#e57373,stroke:#b71c1c,stroke-width:2px
    classDef storageStyle fill:#81c784,stroke:#2e7d32,stroke-width:2px

    class Users userStyle
    class Canvas,Design frontendStyle
    class API,WS backendStyle
    class AI externalStyle
    class DB storageStyle
```

**Figure 1.** High-level architecture of the Sketch2Screen application.

## Description

Sketch2Screen is built with a client-server architecture that enables real-time collaboration and AI-powered design generation. The frontend, built with React, is where users interact with the application through a drawing canvas and design interface. Users can sketch UI components, arrange layouts, and export code directly from their browser.

The backend consists of a Django server with two main components: a REST API server that handles requests for AI generation, component selection, and code export, and a WebSocket server that manages real-time collaboration features. When a user draws on the canvas, those changes are instantly synchronized across all collaborators through WebSocket connections. The system integrates with Anthropic's Claude API to analyze sketch images and generate HTML/CSS component designs.

All workspace data, including sketches, generated components, and design layouts, are persisted in a SQLite database, allowing users to save their work and return to it later via a shareable workspace link. The final output is production-ready code in various frameworks (HTML/CSS, React, Vue, etc.) that users can download and integrate directly into their projects.


