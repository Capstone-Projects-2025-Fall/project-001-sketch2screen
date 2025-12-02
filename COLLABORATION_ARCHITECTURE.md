# Collaboration Architecture Documentation

This document provides a comprehensive explanation of how the real-time collaboration feature works in Sketch2Screen.

## Architecture Overview

The collaboration system uses **WebSockets** for real-time communication between users. It has four main components:

### Backend Components

1. **`SketchConsumer`** (backend/sketch_api/consumers.py:8) - Django Channels WebSocket handler
2. **`CollabServer`** (backend/sketch_api/CollabServer.py:73) - Singleton server managing all collaboration sessions

### Frontend Components

3. **`CollabClient`** (frontend/src/App/CollabClient.ts:11) - WebSocket client wrapper
4. **`useCollaboration`** hook (frontend/src/App/useCollaboration.ts:73) - React hook integrating collaboration into the app

---

## Connection Establishment Flow

### 1. User Initiates Collaboration
- User clicks collaboration button, triggering `handleShowCollaboration()`
- A dialog appears asking for a username (CollaborationDialog.tsx)
- When user submits username, `handleConfirmUsername()` is called, which:
  - Sets `collabEnabled = true`
  - Stores the username
  - Triggers the main WebSocket connection effect

### 2. WebSocket Connection (useCollaboration.ts:225-397)
```
WebSocket URL: ws://hostname:port/ws/collab/{collabID}/
```
- A `CollabClient` instance is created with the collabID and username
- The client generates a unique `userID` using timestamp + random string (CollabClient.ts:42)
- WebSocket connects to backend `SketchConsumer`

### 3. Backend Registration (consumers.py:11-14)
- `SketchConsumer.connect()` is called
- Extracts `collabID` from URL route
- Calls `CollabServer.onNewConnection()` (CollabServer.py:113)
- Server creates a `CollabSession` if it doesn't exist (CollabServer.py:117)
- Adds channel name to session members list

### 4. State Synchronization (CollabServer.py:122-135)
When a new connection joins, the server sends:
- All existing sketches (pages) in the session
- All existing collaborators currently in the session
- **Issue**: There's a duplicate loop (lines 128-131 and 133-135) that sends existing collaborators twice

### 5. Announcing Presence (CollabClient.ts:367-383)
Once WebSocket opens:
- Client sends a `collaborator_join` message with `userID` and `username`
- Backend broadcasts this to all OTHER members (CollabServer.py:146-149)
- Frontend adds new collaborator to local `collaborators` Map (useCollaboration.ts:286-312)

---

## Scene Update Mechanism

This is the core of the collaboration feature and involves a **differential update system** to minimize bandwidth.

### 1. Local User Draws (useCollaboration.ts:473-486)
- When Excalidraw canvas changes, `handleCollabSceneChange()` is called
- The system generates a **diff** between the last sent scene and current scene (util.ts:1-30)
  - Only changed properties are included
  - Reduces payload size dramatically
- The diff is sent via `collabClient.sendSceneUpdate()` (CollabClient.ts:127-152)

### 2. Sending Scene Update (CollabClient.ts:127-152)
- Before sending, the client **strips out non-serializable data** like the `collaborators` Map
- Creates a clean copy with only `elements`, `appState`, and `files`
- Sends JSON message: `{ action: "scene_update", sketchID, sketchData }`

### 3. Backend Receives Update (consumers.py:23-24)
- `SketchConsumer.receive()` handles the message
- Calls `CollabServer.onSceneUpdate()` (CollabServer.py:165-182)

### 4. Backend Applies Diff (CollabServer.py:178)
- Server maintains the **full scene state** in memory
- Calls `applyDiff(match.sceneData, sceneData)` to merge the incoming diff with stored state
- This uses a custom diff application function (CollabServer.py:5-40)
- Broadcasts the **diff** (not full scene) to all OTHER members

### 5. Frontend Receives Update (CollabClient.ts:78-81)
- Client receives `scene_update` message
- Triggers `sceneUpdateHandler` callback
- This calls `stackOrApplyDiff()` in useCollaboration (useCollaboration.ts:142-163)

### 6. Stroke Deferral Mechanism (useCollaboration.ts:142-163)
This is a **critical optimization** to prevent disrupting ongoing drawing:

**The Problem**: If Excalidraw remounts while a user is drawing, it interrupts their stroke.

**The Solution**:
- **`isDrawingRef`** tracks whether the local user is currently drawing (useCollaboration.ts:93, 167-222)
- Set to `true` on `pointerdown`, `false` on `pointerup/cancel/leave`
- **`pendingSceneDiffRef`** stores incoming diffs while drawing (useCollaboration.ts:96)

**Behavior**:
- If update is for the **active page** AND user **is drawing**:
  - Store diff in `pendingSceneDiffRef` (line 148-151)
  - Stack multiple diffs if more arrive (line 148)
  - **Don't update scene yet**
- If user is **not drawing**:
  - Apply diff immediately via `updatePageFromDiff()` (line 156)
  - Increment `sceneVersion` to force Excalidraw remount (line 157)
- On stroke completion (`pointerup`):
  - Apply all pending diffs (lines 199-202)

### 7. Applying the Diff (useCollaboration.ts:112-131)
- `updatePageFromDiff()` updates the React state
- Applies diff to the page's scene using `applyDiff()` from util.ts (line 121)
- Updates `lastSentScene` to track what we've seen (line 123)
- This triggers a re-render with the new scene data

---

## Page Update Mechanism

Page updates handle creating, renaming, and deleting pages.

### Frontend Sends (useCollaboration.ts:491-525)
Four notify functions:
- `notifyPageAdded()` - Sends new page with name
- `notifyPageDuplicated()` - Sends page + initial scene data
- `notifyPageRenamed()` - Sends updated name
- `notifyPageDeleted()` - Sends `null` as pageName

### Backend Handles (CollabServer.py:184-203)
- If page doesn't exist: Creates new `Sketch` object (line 191)
- If pageName is `null`: Removes page from session (line 195-197)
- Otherwise: Updates page name (line 199)
- Broadcasts to all other members

### Frontend Receives (useCollaboration.ts:242-276)
- If name is `null`: Filters page out of pages array (line 249)
- If page exists: Updates name (line 259-263)
- If page doesn't exist: Adds new page with empty scene (line 267-274)

---

## Collaborator Cursor System

This feature shows each user's cursor position with their name.

### 1. Sending Pointer Updates (useCollaboration.ts:174-190)
- `pointermove` event listener on canvas
- **Throttled to 50ms** to avoid flooding WebSocket (line 104, 178)
- Converts client coordinates to canvas-relative coordinates (lines 182-184)
- Calls `sendPointerUpdate()` which includes `currentPage` (CollabClient.ts:229-238)

### 2. Page Filtering
**Critical feature**: Cursors are only shown for users on the same page.

- `CollabClient.currentPage` tracks which page the user is viewing (CollabClient.ts:25)
- Updated whenever active page changes (useCollaboration.ts:135-140)
- Sent with every pointer update (CollabClient.ts:235)

### 3. Backend Broadcasts (CollabServer.py:151-163)
- Updates stored collaborator pointer and currentPage (lines 155-157)
- Broadcasts to all OTHER members with pageID included

### 4. Frontend Filters Cursors (useCollaboration.ts:327-364)
When pointer update received:
- Check if user is on the **same page** as local user (line 344)
- If **different page**: Set pointer to `null` (hide cursor) (line 350)
- If **same page**: Update pointer position (line 360)
- This ensures you only see cursors of collaborators on your current page

### 5. Rendering Cursors (useCollaboration.ts:400-445)
- `updateSceneCollaborators()` updates Excalidraw with the collaborators Map
- Each collaborator gets a unique color based on their userID hash (lines 551-572)
- Excalidraw's built-in collaboration features render the cursors

---

## Known Issues & Potential Bugs

### 1. Duplicate Collaborator Broadcast
**Location**: CollabServer.py:128-135

Lines 128-131 and 133-135 send the same collaborators twice. This is wasteful and could cause UI issues.

### 2. In-Memory Storage Only
**Location**: CollabServer.py:111

- All collaboration sessions stored in memory
- Sessions are lost on server restart
- No persistence to database
- **Impact**: Users lose collaboration state on server restart

### 3. Page ID Format Dependency
**Location**: CollabClient.ts:66-76

- Page IDs must follow format: `{collabId}-p{index}`
- If this format is violated, filtering breaks
- No validation to enforce this format

### 4. Scene Diff System Complexity
**Locations**: util.ts and CollabServer.py:5-40

- Two different diff implementations: frontend and backend
- Both must handle nested objects, arrays, nulls consistently
- **Risk**: Mismatches can cause state divergence between clients

### 5. Race Conditions
**Impact**: Data loss in concurrent edits

- Multiple users editing same element simultaneously
- Last write wins - no conflict resolution
- Server applies diffs sequentially but doesn't detect conflicts
- **Example**: User A moves element, User B deletes it → unpredictable result

### 6. Collaborators Map Serialization
**Location**: CollabClient.ts:133

- Must strip `collaborators` (a Map object) before sending scene
- Maps aren't JSON-serializable
- If forgotten, WebSocket send fails silently

### 7. Drawing Stroke Detection
**Location**: useCollaboration.ts:167-222

- Uses pointer events on canvas host element
- If canvas structure changes or events don't propagate, detection breaks
- `isDrawingRef` state could get stuck if `pointerup` is missed
- **Symptom**: Updates stop applying until page refresh

### 8. Active Page Reference Management
**Location**: useCollaboration.ts:16

- Uses both `activePageId` state AND `activePageIdRef` ref
- Ref needed for event handlers to access current value without recreating handlers
- **Risk**: Potential for state/ref desync causing wrong page updates

### 9. No WebSocket Reconnection
**Impact**: Poor user experience on network issues

- No automatic reconnection logic
- If WebSocket drops, user must refresh page
- No offline queuing of updates
- No indication to user that connection was lost

### 10. Username Duplication
**Impact**: Confusing UX

- No server-side username uniqueness enforcement
- Multiple users can have same username
- Distinguished only by auto-generated userID
- Users can't tell who is who

---

## Key Data Flow Summary

```
User draws → handleCollabSceneChange → generateDiff → sendSceneUpdate
  ↓
WebSocket → SketchConsumer → CollabServer.onSceneUpdate → applyDiff to server state
  ↓
Broadcast to others → CollabClient.onmessage → sceneUpdateHandler
  ↓
stackOrApplyDiff → (queue if drawing) → updatePageFromDiff → React state update
  ↓
Excalidraw re-renders with new scene
```

---

## Message Protocol Reference

### Client → Server Messages

1. **collaborator_join**
```json
{
  "action": "collaborator_join",
  "userID": "user-123456789-abc123",
  "username": "John Doe"
}
```

2. **scene_update**
```json
{
  "action": "scene_update",
  "sketchID": "123456-p0",
  "sketchData": {
    "elements": [...],
    "appState": {...},
    "files": {...}
  }
}
```

3. **page_update**
```json
{
  "action": "page_update",
  "sketchID": "123456-p0",
  "pageName": "New Page Name"
}
```

4. **collaborator_pointer**
```json
{
  "action": "collaborator_pointer",
  "userID": "user-123456789-abc123",
  "pointer": { "x": 100, "y": 200 },
  "pageID": "123456-p0"
}
```

### Server → Client Messages

Same structure as client messages, broadcasted to all other members in the session.

---

## Debugging Tips

### Enable Verbose Logging
The code already has extensive console.log statements. Filter browser console by:
- `COLLABORATOR:` - Collaborator join/leave/cursor events
- `CURSOR FILTER:` - Cursor filtering logic
- `Received scene update` - Scene synchronization

### Common Debugging Scenarios

**Cursors not showing up:**
1. Check if `collaborators` Map has entries (useCollaboration.ts:431)
2. Verify pageID matches between users (useCollaboration.ts:328)
3. Check if `updateSceneCollaborators()` is being called (useCollaboration.ts:414)

**Scene not syncing:**
1. Verify WebSocket is connected (check Network tab)
2. Check if diff generation returns undefined (useCollaboration.ts:478)
3. Verify pageID format: `{collabId}-p{index}`
4. Check if `isDrawingRef` is stuck true (useCollaboration.ts:154)

**Pages not syncing:**
1. Check if page IDs follow correct format
2. Verify CollabServer has the session (check backend logs)
3. Check if messages are being filtered out (CollabClient.ts:68-75)

---

## Future Improvements

1. **Add WebSocket reconnection logic** - Handle network interruptions gracefully
2. **Implement conflict resolution** - Operational Transformation or CRDT
3. **Add persistence** - Save collaboration sessions to database
4. **Username uniqueness** - Enforce unique usernames per session
5. **Connection status indicator** - Show users when connection is lost
6. **Remove duplicate collaborator broadcast** - Fix CollabServer.py:128-135
7. **Add page ID validation** - Enforce format requirements
8. **Unify diff implementations** - Use same diff logic on frontend and backend
9. **Add stroke detection fallback** - Timeout if pointerup is missed
10. **Add message queuing** - Queue updates when WebSocket is disconnected

---

## Related Files

- `frontend/src/App/CollabClient.ts` - WebSocket client wrapper
- `frontend/src/App/useCollaboration.ts` - React hook for collaboration
- `frontend/src/App/CollaborationDialog.tsx` - UI for joining collaboration
- `frontend/src/App/util.ts` - Diff generation and application
- `backend/sketch_api/consumers.py` - WebSocket message handler
- `backend/sketch_api/CollabServer.py` - Collaboration server logic
- `CLAUDE.md` - Project overview and development guide
