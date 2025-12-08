---
sidebar_position: 2
---

# Sequence Diagrams

## Use Case 1: Starting a Session and Drawing UI Sketches
*As a user, I want to start sketching UI components for my website*

1. User navigates to the Sketch2Screen application URL
2. Frontend generates unique session ID and creates initial page
3. User sees Excalidraw canvas interface with drawing tools
4. User draws UI components (buttons, forms, navigation, etc.) on canvas
5. Frontend tracks all drawing changes in local state

```mermaid
---
title: Sequence Diagram 1 – Starting a Session and Drawing UI Sketches
---

sequenceDiagram
    actor User
    participant Frontend

    User->>Frontend: Navigate to application URL
    Frontend->>Frontend: Generate session ID from timestamp
    Frontend->>Frontend: Create initial page with Excalidraw canvas
    Frontend-->>User: Display drawing interface

    User->>Frontend: Draw UI components on canvas
    Frontend->>Frontend: Update scene state with drawing data
    Frontend-->>User: Show real-time drawing feedback

    Note over User,Frontend: All drawing stored locally<br/>in React state
```

## Use Case 2: Generating HTML from Sketches with AI
*As a user, I want to convert my sketches into production-ready HTML using Claude AI*

1. User clicks "Generate" button in navbar
2. Frontend shows loading indicator
3. Frontend checks which pages have changed since last generation (smart caching)
4. For each changed page, frontend exports canvas to PNG via Excalidraw API
5. Frontend sends multipart/form-data to `/api/generate-multi/` with all page images
6. Backend processes each image in parallel using asyncio
7. Backend converts PNG to base64 and sends to Claude API
8. Claude analyzes sketch and returns raw HTML with Tailwind CSS
9. Frontend receives HTML for each page and displays in sanitized iframe
10. Frontend caches scene state to avoid regenerating unchanged pages next time

```mermaid
---
title: Sequence Diagram 2 – Generating HTML from Sketches with AI
---

sequenceDiagram
    actor User
    participant Frontend
    participant Backend as Backend (Django)
    participant Claude as Claude API (Anthropic)

    User->>Frontend: Click "Generate" button
    Frontend-->>User: Show loading indicator
    Frontend->>Frontend: Compare scenes with lastGeneratedScenes cache

    loop For each changed page
        Frontend->>Frontend: Export canvas to PNG blob (exportToBlob)
    end

    Frontend->>Backend: POST /api/generate-multi/ (multipart/form-data)
    Note over Frontend,Backend: FormData contains:<br/>file_0, file_1, ...<br/>name_0, name_1, ...<br/>id_0, id_1, ...<br/>count

    loop For each uploaded image (parallel async)
        Backend->>Backend: Read image bytes
        Backend->>Backend: Convert to base64
        Backend->>Claude: Send image + system prompt
        Note over Claude: Model: claude-haiku-4-5-20251001<br/>Analyzes sketch, generates HTML<br/>with Tailwind CSS
        Claude-->>Backend: Return raw HTML (no markdown)
    end

    Backend-->>Frontend: JSON { results: [{id, html}, ...] }

    Frontend->>Frontend: Combine new + cached mockups
    Frontend->>Frontend: Update lastGeneratedScenes cache
    Frontend->>Frontend: Switch to Mockup view
    Frontend-->>User: Display generated HTML in iframe (DOMPurify sanitized)

    alt Generation fails
        Backend-->>Frontend: Error response
        Frontend-->>User: Display "Generation failed"
    end
```

## Use Case 3: Managing Multiple Sketch Pages
*As a user, I want to create multiple pages for a multi-page website design*

1. User clicks "Add Page" button in sidebar
2. Frontend creates new page and switches to it
3. User can rename pages by double-clicking page name
4. User can duplicate pages to reuse design
5. User can delete pages (minimum 1 page required)
6. User can switch between pages to work on different screens

```mermaid
---
title: Sequence Diagram 3 – Managing Multiple Sketch Pages
---

sequenceDiagram
    actor User
    participant Frontend

    User->>Frontend: Click "Add Page"
    Frontend->>Frontend: Create new page with unique ID
    Frontend->>Frontend: Set as active page
    Frontend-->>User: Display new blank canvas

    User->>Frontend: Double-click page name
    Frontend-->>User: Show rename input
    User->>Frontend: Enter new name
    Frontend->>Frontend: Update page name in state

    User->>Frontend: Click "Duplicate Page"
    Frontend->>Frontend: Clone page with scene data
    Frontend->>Frontend: Add to pages array
    Frontend-->>User: Show duplicated page

    User->>Frontend: Switch to different page
    Frontend->>Frontend: Update active page ID
    Frontend->>Frontend: Load page's scene into Excalidraw
    Frontend-->>User: Display selected page's canvas
```

## Use Case 4: Editing Mockup Styles and Adding Page Links
*As a user, I want to customize the generated HTML and link pages together*

1. User views generated mockup in iframe
2. User clicks element inspector to select HTML element
3. User modifies CSS styles (colors, sizes, spacing, etc.)
4. Frontend tracks style changes in `mockupStyles` state with undo/redo history
5. User can link elements to other pages via link dialog
6. Frontend stores page links in `pageLinks` state mapping elementId to target pageId
7. Changes are applied immediately in iframe and persisted for export

```mermaid
---
title: Sequence Diagram 4 – Editing Mockup Styles and Adding Page Links
---

sequenceDiagram
    actor User
    participant Frontend
    participant Iframe as Mockup Iframe

    User->>Frontend: View generated mockup
    Frontend-->>User: Display HTML in iframe

    User->>Frontend: Click element inspector
    Frontend->>Iframe: Enable element selection
    User->>Iframe: Click HTML element
    Iframe-->>Frontend: Return selected element

    User->>Frontend: Modify CSS styles in style editor
    Frontend->>Frontend: Update mockupStyles state
    Note over Frontend: Stores per-page, per-element:<br/>{ current, history, future }
    Frontend->>Iframe: Apply style changes to element
    Iframe-->>User: Show updated styles

    alt User wants to link to another page
        User->>Frontend: Click "Add Page Link"
        Frontend-->>User: Show page link dialog
        User->>Frontend: Select target page
        Frontend->>Frontend: Update pageLinks state
        Note over Frontend: Maps elementId -> targetPageId
        Frontend->>Iframe: Add click handler to element
    end

    User->>Frontend: Undo/Redo style changes
    Frontend->>Frontend: Navigate history/future arrays
    Frontend->>Iframe: Apply historical styles

    Note over Frontend: No backend calls -<br/>all state managed in React
```

## Use Case 5: Exporting HTML Files
*As a user, I want to export my generated mockups as HTML files*

1. User clicks export option from navbar dropdown
2. User chooses export format: single page, multi-page single HTML, or multi-page ZIP
3. Frontend reads iframe content and applies all style modifications
4. Frontend processes page links to enable navigation between pages
5. System generates download with all customizations applied
6. User receives HTML file(s) ready to deploy

```mermaid
---
title: Sequence Diagram 5 – Exporting HTML Files
---

sequenceDiagram
    actor User
    participant Frontend
    participant Iframe as Mockup Iframe
    participant Browser

    User->>Frontend: Click export dropdown in navbar
    Frontend-->>User: Show export options

    alt Export Single Page
        User->>Frontend: Click "Export Current Page"
        Frontend->>Iframe: Read iframe document
        Frontend->>Frontend: Apply mockupStyles changes
        Frontend->>Frontend: Generate clean HTML with inline styles
        Frontend->>Browser: Trigger download "{pageName}.html"
        Browser-->>User: Download HTML file
    end

    alt Export Multi-Page (Single HTML)
        User->>Frontend: Click "Export as Single HTML"
        Frontend->>Frontend: Gather all mockup pages

        loop For each mockup page
            Frontend->>Frontend: Apply style modifications
            Frontend->>Frontend: Process page links
        end

        Frontend->>Frontend: Combine into single HTML with navigation
        Note over Frontend: Adds internal links<br/>and page switching logic
        Frontend->>Browser: Trigger download "{projectName}.html"
        Browser-->>User: Download single HTML file
    end

    alt Export Multi-Page (ZIP)
        User->>Frontend: Click "Export as ZIP"
        Frontend->>Frontend: Gather all mockup pages

        loop For each mockup page
            Frontend->>Frontend: Apply style modifications
            Frontend->>Frontend: Convert page links to relative paths
            Frontend->>Frontend: Create individual HTML file
        end

        Frontend->>Frontend: Package files into ZIP
        Note over Frontend: Uses JSZip library
        Frontend->>Browser: Trigger download "{projectName}.zip"
        Browser-->>User: Download ZIP archive
    end

    Note over Frontend,Browser: No backend calls -<br/>all processing client-side
```

## Use Case 6: Real-time Collaboration
*As a collaborator, I want to join an existing session and edit together*

1. User A clicks "Start Collaboration" and shares link with `?collab={collabID}` parameter
2. User B clicks the link and enters username when prompted
3. Frontend connects to WebSocket at `/ws/collab/{collabID}/`
4. Backend syncs existing pages and collaborators to User B
5. Both users can now draw and see each other's changes in real-time
6. Collaborator cursors are shown (filtered by active page)

```mermaid
---
title: Sequence Diagram 6 – Real-time Collaboration
---

sequenceDiagram
    actor UserA as User A (Host)
    actor UserB as User B (Joining)
    participant Frontend
    participant WebSocket
    participant CollabServer as CollabServer (Backend)

    UserA->>Frontend: Click "Start Collaboration"
    Frontend-->>UserA: Display username dialog
    UserA->>Frontend: Enter username
    Frontend->>WebSocket: Connect to /ws/collab/{collabID}/
    Frontend-->>UserA: Show shareable link

    UserA->>UserB: Share link with ?collab={collabID}
    UserB->>Frontend: Click link and navigate
    Frontend-->>UserB: Show username dialog
    UserB->>Frontend: Enter username and confirm
    Frontend->>WebSocket: Connect to /ws/collab/{collabID}/

    CollabServer->>CollabServer: Find existing session
    CollabServer->>CollabServer: Add User B to members

    loop Sync existing state to User B
        CollabServer->>WebSocket: Send page_update
        CollabServer->>WebSocket: Send scene_update
        CollabServer->>WebSocket: Send collaborator_join
    end

    WebSocket-->>Frontend: Receive full state
    Frontend-->>UserB: Display shared canvas

    Note over UserA,UserB: Both users can now draw<br/>Changes broadcast via WebSocket<br/>Scene diffs prevent conflicts

    UserA->>Frontend: Draw on canvas
    Frontend->>WebSocket: Send scene_update (diff)
    WebSocket->>CollabServer: Apply diff to session
    CollabServer->>WebSocket: Broadcast to User B
    Frontend-->>UserB: Update canvas with User A's drawing
```
