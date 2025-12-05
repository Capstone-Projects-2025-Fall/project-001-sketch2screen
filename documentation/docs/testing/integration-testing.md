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

### 1. Creating Sketches

**Purpose**: Test if ExcalidrawAPI used for sketching is functioning as expected

**Steps:**
1. Select a tool from the sketch tool bar and draw or input on screen
2. Verify if tool is working
3. Redo with another tool

**Expected Outcome:**
All tools work as specified in the API used for sketching with minimum latency


### 2. Creating Sketches with Real-time Collaboration

**Purpose:** Verify real-time drawing synchronization across collaborators.

**Steps:**
1. Press "Collaborate"
2. Send collaborate link to other users
1. Simulate drawing tool selection and canvas strokes
2. Mock WebSocket broadcasts stroke data to collaborators
3. Verify other users' canvases update instantly
4. Confirm auto-save triggers after drawing completion

**Expected Outcome:**
Strokes broadcast in real-time to all collaborators. Canvas auto-saves successfully. Connection loss queues data locally with "Connection lost" indicator. Reconnection syncs queued changes.

---

### 3. Generate Design/s from Sketch

**Purpose:** To test if call to API is generating design based on sketch/s passed

**Steps:** 
1. Add a page or duplicate current sketch
2. Sketch/edit on the new/duplicated page.
3. Press "Generate"
4. View generated designs using AI on "Design" tab.

**Expected Outcome:**
Designs for the exact number of pages sketched would be generated

### 4. Select and Edit Component in Design

**Purpose:** Verify if element in the design can be selected and edited

**Steps:** 
1. Select a component in the design  
2. Edit the component from the settings panel

**Expected Outcome:**
A settings panel would appear on the left side, which would allow you to edit specific styles for the component

### 5. Select and Edit Component using AI

**Purpose:** Verify AI generation of selected component in design

**Steps:**
1. Select an element and go to "Variations" tab in the left sidebar
2. Select a generated variation of the component and confirm if it is reflected in design
3. Press "✨" and input prompt for specific styling and press enter
4. Select generated variation from prompt and confirm if reflected in design

**Expected Outcome:**
AI generates multiple variations per sketch element. Selection interface displays all options. Failed generation shows "Generation failed". 


### 6. Exporting Final Code

**Purpose:** Verify code generation and export

**Steps:**
1. Simulate "Export" button click
2. Initiates download of code on local computer

**Expected Outcome:**
Code downloads successfully. 
