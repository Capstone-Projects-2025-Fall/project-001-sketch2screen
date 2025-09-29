---
sidebar_position: 2
---

# Sequence Diagrams

## Use Case 1: Creating a New Workspace
*As a user, I want to create a new workspace to start sketching my website design*

1. User navigates to the Sketch2Screen application homepage
2. User clicks "Create New Workspace" button
3. System generates a unique workspace ID and shareable link
4. System redirects user to the sketch canvas interface with drawing tools
5. System displays the shareable workspace link/code for collaboration

```mermaid
---
title: Sequence Diagram 1 – Creating a New Workspace
---

sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Navigate to homepage
    Frontend-->>User: Display landing page
    User->>Frontend: Click "Create New Workspace"
    Frontend->>Backend: POST /workspace/create
    activate Backend
    Backend->>Database: Generate unique workspace ID
    Database-->>Backend: Return workspace ID & shareable link
    Backend-->>Frontend: Send workspace data
    deactivate Backend
    Frontend->>Frontend: Redirect to sketch canvas
    Frontend-->>User: Display sketch interface with shareable link

    Note over Backend,Database: Alt: Workspace creation fails
    Backend-->>Frontend: Error: Unable to create workspace
    Frontend-->>User: Display error message
```

## Use Case 2: Joining an Existing Workspace
*As a collaborator, I want to join a workspace using a shared link so I can work with my team*

1. User receives workspace link or code from workspace creator
2. User clicks on shared link or enters workspace code on homepage
3. System validates the workspace link/code
4. System loads the existing workspace with current canvas state
5. User sees the current sketch canvas and any existing work from other collaborators
6. System notifies other active users of the new collaborator joining

```mermaid
---
title: Sequence Diagram 2 – Joining an Existing Workspace
---

sequenceDiagram
    actor Collaborator
    actor Other_Users as Other Users
    participant Frontend
    participant Backend
    participant Database
    participant WebSocket

    Collaborator->>Frontend: Click shared link or enter code
    Frontend->>Backend: GET /workspace/{id}/validate
    Backend->>Database: Check workspace exists

    alt Workspace exists
        Database-->>Backend: Return workspace data
        Backend-->>Frontend: Send current workspace state
        Frontend->>WebSocket: Connect to workspace channel
        WebSocket->>Other_Users: Notify new collaborator joined
        Frontend-->>Collaborator: Display canvas with existing work
    else Invalid workspace
        Database-->>Backend: Workspace not found
        Backend-->>Frontend: Error: Invalid workspace
        Frontend-->>Collaborator: Display error and redirect to homepage
    else Workspace deleted
        Database-->>Backend: Workspace deleted
        Backend-->>Frontend: Error: Workspace no longer available
        Frontend-->>Collaborator: Display error and redirect to homepage
    end
```

## Use Case 3: Creating Sketches with Real-time Collaboration
*As a user, I want to draw UI components on the canvas and see my teammates' drawings in real-time*

1. User selects drawing tool from toolbar (pen, shapes, text, etc.)
2. User draws UI component sketches on canvas
3. System captures drawing strokes and broadcasts updates to all active collaborators
4. Other users see drawing updates appear on their canvas immediately
5. User completes sketch
6. System automatically saves current canvas state

```mermaid
---
title: Sequence Diagram 3 – Creating Sketches with Real-time Collaboration
---

sequenceDiagram
    actor User
    actor Collaborators
    participant Frontend
    participant WebSocket
    participant Backend
    participant Database

    User->>Frontend: Select drawing tool
    Frontend-->>User: Activate drawing mode
    User->>Frontend: Draw on canvas
    Frontend->>Frontend: Capture drawing strokes

    loop For each stroke
        Frontend->>WebSocket: Broadcast drawing data
        WebSocket->>Backend: Relay drawing updates
        Backend->>WebSocket: Forward to other users
        WebSocket->>Collaborators: Send real-time drawing updates
        Collaborators->>Collaborators: Update canvas with new drawing
    end

    User->>Frontend: Complete sketch
    Frontend->>Backend: POST /workspace/save
    Backend->>Database: Save canvas state
    Database-->>Backend: Confirm save
    Backend-->>Frontend: Save confirmed

    Note over Frontend,WebSocket: Alt: Connection lost
    Frontend->>Frontend: Queue drawing data locally
    Frontend-->>User: Show "Connection lost" indicator
    WebSocket-->>Frontend: Connection restored
    Frontend->>WebSocket: Sync queued changes
```

## Use Case 4: Generating AI Components from Sketches
*As a user, I want to convert my sketches into professional UI components using AI*

1. User completes sketching UI components on canvas
2. User clicks "Generate" button
3. System displays loading indicator
4. System processes canvas sketches and sends to AI model
5. AI model analyzes sketches and generates multiple UI component variations
6. System displays generated component options in selection interface
7. User reviews the multiple variations for each sketch element

```mermaid
---
title: Sequence Diagram 4 – Generating AI Components from Sketches
---

sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant AI_Model as AI Model

    User->>Frontend: Click "Generate" button
    Frontend-->>User: Show loading indicator
    Frontend->>Backend: POST /generate with canvas data
    Backend->>AI_Model: Process sketches for UI components
    Note over AI_Model: Analyze sketches and<br/>generate multiple variations

    alt Generation successful
        AI_Model-->>Backend: Return generated component options
        Backend-->>Frontend: Send component variations
        Frontend-->>User: Display selection interface with options
    else AI generation fails
        AI_Model-->>Backend: Generation error
        Backend-->>Frontend: Error: Generation failed
        Frontend-->>User: Display "Generation failed. Please try again."
    else No components detected
        AI_Model-->>Backend: No recognizable UI components
        Backend-->>Frontend: No components found
        Frontend-->>User: Display "No UI components detected"
    end
```

## Use Case 5: Selecting and Customizing Generated Components
*As a user, I want to choose my favorite design variations from the AI-generated options*

1. System displays multiple variations for each identified sketch element
2. User reviews all component options
3. User clicks to select preferred version of each component
4. System highlights selected components
5. User clicks "Apply Selected Components" to confirm selections
6. System prepares to transfer selected components to design page

```mermaid
---
title: Sequence Diagram 5 – Selecting and Customizing Generated Components
---

sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant AI_Model as AI Model

    Frontend-->>User: Display generated component variations
    User->>Frontend: Review component options
    User->>Frontend: Select preferred variations
    Frontend->>Frontend: Highlight selected components

    alt User applies selections
        User->>Frontend: Click "Apply Selected Components"
        Frontend->>Backend: POST /components/select
        Backend-->>Frontend: Confirm selections
        Frontend-->>User: Prepare transition to design mode
    else User wants to regenerate
        User->>Frontend: Click "Regenerate"
        Frontend->>Backend: POST /generate with canvas data
        Backend->>AI_Model: Process sketches again
        AI_Model-->>Backend: Return new variations
        Backend-->>Frontend: Send new options
        Frontend-->>User: Display updated component options
    else No components selected
        User->>Frontend: Click "Apply" with no selections
        Frontend-->>User: Display "Please select at least one component"
    end
```

## Use Case 6: Arranging Components in Design Mode
*As a user, I want to arrange the selected components into a complete page layout*

1. System switches to design mode interface
2. System displays selected components as draggable elements on design canvas
3. User drags and drops components to arrange layout
4. System provides alignment guides and snap-to-grid functionality
5. User resizes components as needed using drag handles
6. User adjusts spacing and positioning until satisfied with layout
7. System saves current design state

```mermaid
---
title: Sequence Diagram 6 – Arranging Components in Design Mode
---

sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database

    Frontend->>Frontend: Switch to design mode interface
    Frontend-->>User: Display components as draggable elements

    loop Design adjustments
        User->>Frontend: Drag and drop components
        Frontend->>Frontend: Provide alignment guides
        User->>Frontend: Resize components
        Frontend->>Frontend: Update component dimensions
        User->>Frontend: Adjust spacing and positioning
    end

    Frontend->>Backend: POST /design/save
    Backend->>Database: Save design state
    Database-->>Backend: Confirm save
    Backend-->>Frontend: Design saved

    Note over User,Frontend: Alt: User wants to modify component
    User->>Frontend: Right-click component
    Frontend-->>User: Show options menu
    User->>Frontend: Select modification option
    Frontend->>Frontend: Apply component changes

    Note over User,Frontend: Alt: User wants to add more components
    User->>Frontend: Click "Add More Components"
    Frontend->>Frontend: Return to sketch canvas mode
```

## Use Case 7: Exporting Final Code
*As a user, I want to export my design as usable code for different frameworks*

1. User completes design arrangement
2. User clicks "Export" button from design interface
3. System displays export options dialog with framework choices
4. User selects desired framework and export format
5. System generates code based on current design layout
6. System packages code files and presents download options
7. User downloads generated code files
8. System confirms successful export

```mermaid
---
title: Sequence Diagram 7 – Exporting Final Code
---

sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Code_Generator as Code Generator

    User->>Frontend: Click "Export" button
    Frontend-->>User: Display export options dialog
    Frontend-->>User: Show framework choices
    User->>Frontend: Select framework and format
    Frontend->>Backend: POST /export with design and preferences
    Backend->>Code_Generator: Generate code based on design

    alt Code generation successful
        Code_Generator-->>Backend: Return generated code files
        Backend->>Backend: Package code files
        Backend-->>Frontend: Send download package
        Frontend-->>User: Present download options
        User->>Frontend: Download generated code files
        Frontend-->>User: Confirm successful export
    else Code generation fails
        Code_Generator-->>Backend: Generation error
        Backend-->>Frontend: Export failed
        Frontend-->>User: Display "Export failed. Please try again."
    else No components to export
        Frontend->>Frontend: Check for components
        Frontend-->>User: Display "No components to export"
    end
```

## Use Case 8: Saving and Resuming Workspace
*As a user, I want to save my work and return to it later*

1. System automatically saves workspace state periodically during work
2. User bookmarks or saves the workspace URL for later access
3. User returns to the saved workspace URL at a later time
4. System loads saved workspace state including sketches, selected components, and design layout
5. User can continue working from where they left off

```mermaid
---
title: Sequence Diagram 8 – Saving and Resuming Workspace
---

sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database

    Note over Frontend,Backend: Automatic saving during work
    loop Periodic saves
        Frontend->>Backend: POST /workspace/save (auto-save)
        Backend->>Database: Store workspace data
        Database-->>Backend: Confirm data saved
    end

    User->>Frontend: Bookmark workspace URL
    Note over User: User returns later
    User->>Frontend: Access saved workspace URL
    Frontend->>Backend: GET /workspace/{id}
    Backend->>Database: Retrieve workspace state

    alt Workspace data intact
        Database-->>Backend: Return saved data
        Backend-->>Frontend: Send complete workspace state
        Frontend-->>User: Restore canvas, components, and layout
    else Workspace data corrupted
        Database-->>Backend: Data corruption error
        Backend-->>Frontend: Unable to load workspace
        Frontend-->>User: Display error with option to start fresh
    else Partial data recovery
        Database-->>Backend: Partial workspace data
        Backend-->>Frontend: Send available data with warning
        Frontend-->>User: Load recovered data and notify of loss
    end
```
