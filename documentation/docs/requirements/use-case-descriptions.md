# Use Case Descriptions

## **Use Case 1: Creating a New Workspace**

**Actor:** User  
**Triggering Event:** User navigates to the Sketch2Screen application homepage  

**Normal Flow:**
1. User opens the Sketch2Screen web application in their browser
2. System displays the main landing page with "Create New Workspace" option
3. User clicks "Create New Workspace" 
4. System generates a unique workspace ID and shareable link
5. System redirects user to the sketch canvas interface
6. System displays drawing toolbar and empty canvas in sketch mode
7. System shows the shareable workspace link/code for collaboration

**Alternate Flow:**
- 3a. If system fails to generate workspace:
  - System displays error message "Unable to create workspace. Please try again."
  - User returns to step 3

## **Use Case 2: Joining an Existing Workspace**

**Actor:** Collaborator  
**Triggering Event:** User receives a workspace link or code from workspace creator  

**Normal Flow:**
1. User clicks on shared workspace link or enters workspace code on homepage
2. System validates the workspace link/code
3. System loads the existing workspace with current canvas state
4. System adds user to active collaborators list
5. User sees the current sketch canvas and any existing work
6. System notifies other active users of the new collaborator (visual indicator)

**Alternate Flow:**
- 2a. If workspace link/code is invalid:
  - System displays "Workspace not found" error
  - System redirects to homepage
- 3a. If workspace has been deleted:
  - System displays "This workspace is no longer available"
  - System redirects to homepage

## **Use Case 3: Creating Sketches with Real-time Collaboration**

**Actor:** User, Collaborators  
**Triggering Event:** User begins drawing on the canvas  

**Normal Flow:**
1. User selects drawing tool from toolbar (pen, shapes, text, etc.)
2. User draws UI component sketches on canvas
3. System captures drawing strokes in real-time
4. System broadcasts drawing updates to all active collaborators
5. Other users see drawing updates appear on their canvas immediately
6. User completes sketch and stops drawing
7. System saves current canvas state

**Alternate Flow:**
- 4a. If network connection is lost:
  - System queues drawing data locally
  - System displays "Connection lost" indicator
  - When connection resumes, system syncs queued changes
- 5a. If multiple users draw simultaneously:
  - System handles concurrent updates without conflict
  - All changes are merged and displayed to all users

## **Use Case 4: Generating AI Components from Sketches**

**Actor:** User, AI Model  
**Triggering Event:** User clicks "Generate" button after completing sketches  

**Normal Flow:**
1. User clicks "Generate" button
2. System displays loading indicator
3. System processes canvas sketches and sends to AI model
4. AI model analyzes sketches and generates multiple UI component options
5. System receives generated components and displays them in selection interface
6. System shows multiple variations for each identified sketch element
7. User reviews generated options

**Alternate Flow:**
- 4a. If AI generation fails:
  - System displays error message "Generation failed. Please try again."
  - User returns to canvas to modify sketch or retry generation
- 4b. If no recognizable components in sketch:
  - System displays "No UI components detected. Please add more detail to your sketch."
  - User returns to sketch canvas
- 4c. If generation takes longer than expected:
  - System displays "Still processing... This may take a moment."
  - System continues processing in background

## **Use Case 5: Selecting and Customizing Generated Components**

**Actor:** User  
**Triggering Event:** AI generation completes and options are displayed  

**Normal Flow:**
1. System displays generated component options in selection interface
2. User reviews multiple variations for each sketch element
3. User clicks to select preferred version of each component
4. System highlights selected components
5. User clicks "Apply Selected Components" 
6. System confirms selection and prepares to transfer to design page

**Alternate Flow:**
- 3a. If user is unsatisfied with all options:
  - User clicks "Regenerate" 
  - System returns to Use Case 4 (AI generation)
- 5a. If no components are selected:
  - System displays "Please select at least one component to continue"
  - User returns to step 3

## **Use Case 6: Arranging Components in Design Mode**

**Actor:** User  
**Triggering Event:** User confirms selected components and transitions to design page  

**Normal Flow:**
1. System switches to design mode interface
2. System displays selected components as draggable elements on design canvas
3. User drags and drops components to arrange layout
4. System provides alignment guides and snap-to-grid functionality
5. User resizes components as needed using drag handles
6. User adjusts spacing and positioning until satisfied with layout
7. System saves current design state

**Alternate Flow:**
- 3a. If user wants to modify a component:
  - User right-clicks component for options menu
  - User can delete, duplicate, or modify component properties
- 6a. If user wants to add more sketched components:
  - User clicks "Add More Components"
  - System returns to sketch canvas (Use Case 3)

## **Use Case 7: Exporting Final Code**

**Actor:** User  
**Triggering Event:** User completes design arrangement and clicks export option  

**Normal Flow:**
1. User clicks "Export" button from design interface
2. System displays export options dialog
3. System presents framework choices (HTML/CSS, React, Vue, etc.)
4. User selects desired framework and export format
5. System generates code based on current design layout
6. System packages code files and presents download options
7. User downloads generated code files
8. System confirms successful export

**Alternate Flow:**
- 5a. If code generation fails:
  - System displays "Export failed. Please try again."
  - User returns to step 4 to retry or select different format
- 5b. If design has no components:
  - System displays "No components to export. Please add components first."
  - System returns user to design interface

## **Use Case 8: Saving and Resuming Workspace**

**Actor:** User  
**Triggering Event:** User wants to save current work or return to previous work  

**Normal Flow:**
1. System automatically saves workspace state periodically during work
2. User bookmarks or saves the workspace URL for later access
3. When user returns to URL later, system loads saved workspace state
4. System restores canvas sketches, selected components, and design layout
5. User can continue working from where they left off

**Alternate Flow:**
- 3a. If workspace data is corrupted:
  - System displays "Unable to load workspace data"
  - System offers option to start fresh workspace
- 4a. If partial data recovery is possible:
  - System loads available data and notifies user of potential data loss
  - User can choose to continue with recovered data or start fresh

## **External Interfaces**

### User Interfaces
- **Web Browser Interface**: Primary interaction through modern web browsers (Chrome, Firefox, Safari, Edge)
- **Drawing Canvas**: Touch and mouse input for sketching and design manipulation
- **Collaborative Interface**: Real-time updates between multiple browser sessions

### External Software Systems
- **AI/ML Model API**: Integration with large language model for sketch-to-component generation
- **Web Server**: Backend API for workspace management, data persistence, and real-time communication
- **Real-time Communication**: WebSocket connections for collaborative features

### Data Interfaces
- **Workspace Data Storage**: JSON-based workspace state including sketches, components, and layouts
- **Generated Code Output**: HTML/CSS, React JSX, and other framework-specific code files
- **Import/Export**: Standard web file formats for code download and workspace sharing