---
sidebar_position: 2
---
# Integration Tests

The integration tests validate that Sketch2Screen's components interact correctly by simulating real-world scenarios with mock objects. Tests run automatically, are verified by assertions, and are repeatable.

## Testing Strategy

- Each test validates a corresponding use case from the requirements documentation
- Mock objects simulate user interactions, backend responses, AI processing, and database operations
- Assertions verify expected system behavior and data flow between components
- All tests produce clear pass/fail results

---

## Test Cases

### 1. Creating a New Workspace

**Purpose:** Verify workspace creation and navigation to sketch canvas.

**Steps:**
1. Simulate "Create New Workspace" button click
2. Mock Backend generates workspace ID and shareable link
3. Verify Frontend redirects to sketch canvas with drawing tools
4. Confirm shareable link displays for collaboration

**Expected Outcome:**
Workspace created with unique ID. User redirected to canvas with visible shareable link and available drawing tools. Failed creation shows error: "Unable to create workspace."

---

### 2. Joining an Existing Workspace

**Purpose:** Verify collaborators can join workspaces via shared link/code.

**Steps:**
1. Simulate workspace link/code entry
2. Mock Backend validates and returns workspace data
3. Verify Frontend loads canvas with existing sketches
4. Mock WebSocket notifies active users of new collaborator

**Expected Outcome:**
Valid link loads workspace successfully with current canvas state. Invalid link shows "Workspace not found" error and redirects home. Deleted workspace shows "This workspace is no longer available."

---

### 3. Creating Sketches with Real-time Collaboration

**Purpose:** Verify real-time drawing synchronization across collaborators.

**Steps:**
1. Simulate drawing tool selection and canvas strokes
2. Mock WebSocket broadcasts stroke data to collaborators
3. Verify other users' canvases update instantly
4. Confirm auto-save triggers after drawing completion

**Expected Outcome:**
Strokes broadcast in real-time to all collaborators. Canvas auto-saves successfully. Connection loss queues data locally with "Connection lost" indicator. Reconnection syncs queued changes.

---

### 4. Generating AI Components from Sketches

**Purpose:** Verify AI conversion of sketches into UI component variations.

**Steps:**
1. Simulate "Generate" button click with completed sketch
2. Verify loading indicator appears
3. Mock AI Model returns multiple component variations
4. Confirm Frontend displays all variations in selection interface

**Expected Outcome:**
AI generates multiple variations per sketch element. Selection interface displays all options. Failed generation shows "Generation failed. Please try again." No detected components shows "No UI components detected. Please add more detail to your sketch."

---

### 5. Selecting and Customizing Generated Components

**Purpose:** Verify component variation selection and confirmation.

**Steps:**
1. Display component variations from AI generation
2. Simulate user selecting preferred variations
3. Verify selections are highlighted
4. Simulate "Apply Selected Components" confirmation

**Expected Outcome:**
Selected components highlight correctly and prepare for design mode. "Regenerate" creates new variations. Attempting to proceed without selections shows "Please select at least one component to continue."

---

### 6. Arranging Components in Design Mode

**Purpose:** Verify drag-and-drop component arrangement functionality.

**Steps:**
1. Transition to design mode with selected components
2. Simulate drag-and-drop repositioning of components
3. Verify alignment guides and snap-to-grid appear
4. Simulate component resizing with drag handles
5. Confirm design state saves after changes

**Expected Outcome:**
Components are draggable and resizable. Alignment guides assist positioning. Design state saves automatically. Right-click menu offers delete/duplicate/modify options. "Add More Components" returns to sketch canvas.

---

### 7. Exporting Final Code

**Purpose:** Verify code generation and export in multiple frameworks.

**Steps:**
1. Simulate "Export" button click
2. Verify framework selection dialog appears (HTML/CSS, React, Vue)
3. Mock code generator produces files for selected framework
4. Confirm download initiates with success message

**Expected Outcome:**
Framework options display correctly. Code generates for selected framework and downloads successfully. Export confirmation appears. Failed generation shows "Export failed. Please try again." Empty design shows "No components to export. Please add components first."

---

### 8. Saving and Resuming Workspace

**Purpose:** Verify automatic workspace persistence and restoration.

**Steps:**
1. Simulate periodic auto-save during active work session
2. Mock Database stores workspace state
3. Simulate returning to workspace URL later
4. Verify complete workspace restoration (sketches, components, layout)

**Expected Outcome:**
Workspace auto-saves periodically. Returning to URL restores complete state. User continues from last save. Corrupted data shows "Unable to load workspace data" with fresh start option. Partial recovery loads available data with notification and options.
