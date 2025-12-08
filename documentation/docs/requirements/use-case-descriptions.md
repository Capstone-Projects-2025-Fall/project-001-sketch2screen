# Use Case Descriptions

## Use Case 1: Creating Sketches with Real-time Collaboration
*As a user, I want to draw UI components on the canvas and see my teammates' drawings in real-time*

1. User selects drawing tool from toolbar (pen, shapes, text, etc.)
2. User draws UI component sketches on canvas
3. System captures drawing strokes and broadcasts updates to all active collaborators
4. Other users see drawing updates appear on their canvas immediately
5. User completes sketch
6. System automatically saves current canvas state

**Alternate Flow:**
- If network connection is lost, system queues drawing data locally and displays "Connection lost" indicator
- When connection resumes, system syncs all queued changes
- If multiple users draw simultaneously, system merges all changes without conflict


## Use Case 2: Generate Design using AI
*As a user, I want to convert my sketches into professional UI components using AI*

1. User completes sketching UI components on canvas
2. User clicks "Generate" button
3. System displays loading indicator
4. System processes canvas sketches and sends to AI model
5. AI model analyzes sketches and generates HTML and CSS design
6. System displays generated code in system interface
7. User reviews the generated design

## Use Case 3: Change styling of component
*As a user, I want to convert my sketches into professional UI components using AI*

1. User selects a component from the design
2. Panel on left hand side provides unique styling options based on the type of component
3. User switches to "Settings" tab on the panel
4. User edits styling of component selected from the panel
5. The style changes are applied to the design page

**Alternate Flow:**
- If no component is selected styling panel is invisble

## Use Case 4: Selecting and Customizing Generated Components
*As a user, I want to choose my favorite design variations from the AI-generated options*

1. System displays multiple variations for each identified sketch element
2. User reviews all component options
3. User clicks to select preferred version of each component
4. System highlights selected components
5. User applied selection from the options generated
6. System prepares to transfer selected components to design page

**Alternate Flow:**
- If user is unsatisfied with all options, user can click "Regenerate" to create new variations
- If no components are selected when user tries to continue, system displays "No component selected"

## Use Case 5: Link Generated Pages through selected component
*As a user, I want to be able to link my webpages to each other*

1. User selects component that should redirect to another page
2. User selects the page to redirect from the list of pages generated
3. System highlights component that is linked to page
4. Component when clicked redirects to desired page

## Use Case 6: Exporting Final Code
*As a user, I want to export my design as usable code for different frameworks*

1. User completes design edits
2. User clicks "Export" button from design interface
3. System displays export options with zip, single page, and all pages.
4. Code for designs is downloaded locally

---

## External Interfaces

### User Interfaces
- **Web Browser Interface**: Primary interaction through modern web browsers (Chrome, Firefox, Safari, Edge)
- **Drawing Canvas**: Touch and mouse input for sketching and design manipulation
- **Collaborative Interface**: Real-time updates between multiple browser sessions

### External Software Systems
- **AI/ML Model API**: Integration with large language model for sketch-to-component generation
- **Web Server**: Backend API for workspace management, data persistence, and real-time communication
- **WebSocket Service**: Real-time communication system for collaborative features

### Data Interfaces
- **Generated Code Output**: HTML/CSS, React JSX, and other framework-specific code files
- **Import/Export**: Standard web file formats for code download and workspace sharing
