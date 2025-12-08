# Frontend Components

Complete reference for all React components in Sketch2Screen.

## Component Overview

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| [App](#app-component) | Main application controller | Multi-page management, state coordination, collaboration |
| [Navbar](#navbar-component) | Top navigation bar | Page switching, filename editing, action buttons |
| [Drawing](#drawing-component) | Sketch canvas | Excalidraw integration, PNG export, scene management |
| [Mockup](#mockup-component) | Mockup display | HTML rendering, sidebar navigation, XSS protection |
| [PageSidebar](#pagesidebar-component) | Reusable sidebar | Page list, rename/delete, expand/collapse |
| [CollaborationDialog](#collaborationdialog-component) | Share dialog | Link display, copy to clipboard |
| [LoadingSpinner](#loadingspinner-component) | Loading indicator | Visual feedback during generation |

---

## App Component

**File:** `frontend/src/App/App.tsx`

**Purpose:** Main application component that orchestrates all features including multi-page sketch management, mockup generation, and real-time collaboration.

#### Component Signature

```typescript
export default function App(): JSX.Element
```

#### State Management

**View State:**
```typescript
const [currentPage, setCurrentPage] = useState<Page>(Page.Drawing);
```
- Tracks active view: `Page.Drawing` or `Page.Mockup`

**Sketch Pages:**
```typescript
const [pages, setPages] = useState<SketchPage[]>([...]);
const [activePageId, setActivePageId] = useState<string>(...);
```
- `pages`: Array of all sketch pages with scenes
- `activePageId`: Currently selected page

**Mockup State:**
```typescript
const [mockups, setMockups] = useState<MockupPage[]>([]);
const [activeMockupId, setActiveMockupId] = useState<string | null>(null);
```
- `mockups`: Generated HTML mockups from backend
- `activeMockupId`: Currently displayed mockup

**Collaboration State:**
```typescript
const [collabClient, setCollabClient] = useState<CollabClient | null>(null);
const [showCollabDialog, setShowCollabDialog] = useState(false);
```
- `collabClient`: WebSocket connection for real-time sync
- `showCollabDialog`: Controls visibility of share dialog

**UI State:**
```typescript
const [loading, setLoading] = useState(false);
const [sidebarExpanded, setSidebarExpanded] = useState(true);
const [editingPageId, setEditingPageId] = useState<string | null>(null);
```

#### Key Features

#### 1. Multi-Page Sketch Management

**Add New Page:**
```typescript
const handleAddPage = () => {
  const newPage: SketchPage = {
    id: crypto.randomUUID(),
    name: `Page ${pages.length + 1}`,
    scene: makeEmptyScene()
  };
  setPages([...pages, newPage]);
  setActivePageId(newPage.id);

  // Broadcast to collaborators
  collabClient?.sendPageUpdate(newPage.id, newPage.name);
};
```

**Duplicate Page:**
```typescript
const handleDuplicatePage = () => {
  const activePage = pages.find(p => p.id === activePageId);
  if (!activePage) return;

  const duplicated: SketchPage = {
    id: crypto.randomUUID(),
    name: `${activePage.name} (copy)`,
    scene: JSON.parse(JSON.stringify(activePage.scene)) // Deep copy
  };

  setPages([...pages, duplicated]);
  collabClient?.sendPageUpdate(duplicated.id, duplicated.name);
};
```

**Rename Page:**
```typescript
const handlePageRename = (id: string, newName: string) => {
  setPages(prev => prev.map(p =>
    p.id === id ? { ...p, name: newName } : p
  ));
  collabClient?.sendPageUpdate(id, newName);
};
```

**Delete Page:**
```typescript
const handleDeletePage = (id: string) => {
  if (pages.length <= 1) return; // Minimum 1 page

  setPages(prev => prev.filter(p => p.id !== id));

  // Switch to first page if deleting active
  if (id === activePageId) {
    const remaining = pages.filter(p => p.id !== id);
    setActivePageId(remaining[0].id);
  }

  collabClient?.sendPageUpdate(id, null); // null = delete
};
```

#### 2. Mockup Generation

**Generate Mockups from All Pages:**
```typescript
const handleGenerate = async () => {
  setLoading(true);

  try {
    const formData = new FormData();

    // Export all pages to PNG
    const exports = await Promise.all(
      pages.map(async (page) => {
        const ref = drawingRefs.current[page.id];
        const blob = await ref?.getPNGBlob();
        return { page, blob };
      })
    );

    // Filter out empty pages and add to FormData
    const nonEmpty = exports.filter(e => e.blob !== null);
    formData.append('count', nonEmpty.length.toString());

    nonEmpty.forEach((item, index) => {
      formData.append(`file_${index}`, item.blob!, `${item.page.name}.png`);
      formData.append(`name_${index}`, item.page.name);
      formData.append(`id_${index}`, item.page.id);
    });

    // Call backend
    const response = await fetch('/api/generate-multi/', {
      method: 'POST',
      body: formData
    });

    const { results } = await response.json();

    // Convert to MockupPage objects
    const mockupPages: MockupPage[] = results.map((r: any) => ({
      id: r.id,
      name: pages.find(p => p.id === r.id)?.name || 'Untitled',
      html: r.html
    }));

    setMockups(mockupPages);
    setActiveMockupId(mockupPages[0]?.id || null);
    setCurrentPage(Page.Mockup); // Switch to mockup view

  } catch (error) {
    console.error('Generation failed:', error);
    alert('Failed to generate mockups');
  } finally {
    setLoading(false);
  }
};
```

**Export Current Mockup:**
```typescript
const handleExport = () => {
  const mockup = mockups.find(m => m.id === activeMockupId);
  if (!mockup) return;

  const blob = new Blob([mockup.html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${mockup.name}.html`;
  a.click();
  URL.revokeObjectURL(url);
};
```

#### 3. Real-Time Collaboration

**Initialize Collaboration:**
```typescript
useEffect(() => {
  const collabId = getCollabId(); // From URL or generate new
  const client = new CollabClient(collabId);

  // Handle incoming scene updates
  client.setUpdateHandler((sketchID, sceneData) => {
    setPages(prev => prev.map(page =>
      page.id === sketchID
        ? { ...page, scene: sceneData }
        : page
    ));
  });

  // Handle incoming page updates
  client.setPageUpdateHandler((sketchID, pageName) => {
    if (pageName === null) {
      // Delete page
      setPages(prev => prev.filter(p => p.id !== sketchID));
    } else {
      // Create or rename
      setPages(prev => {
        const exists = prev.find(p => p.id === sketchID);
        if (exists) {
          return prev.map(p =>
            p.id === sketchID ? { ...p, name: pageName } : p
          );
        } else {
          return [...prev, {
            id: sketchID,
            name: pageName,
            scene: makeEmptyScene()
          }];
        }
      });
    }
  });

  setCollabClient(client);

  return () => client.disconnect();
}, []);
```

**Send Scene Updates:**
```typescript
const handleSceneChange = (sceneData: SceneData) => {
  // Update local state
  setPages(prev => prev.map(page =>
    page.id === activePageId
      ? { ...page, scene: sceneData }
      : page
  ));

  // Broadcast to collaborators
  collabClient?.sendSceneUpdate(activePageId, sceneData);
};
```

### Render Structure

```tsx
return (
  <div className={styles.app}>
    <Navbar
      curPage={currentPage}
      onPageChange={setCurrentPage}
      filename={activePageName}
      onFilenameChange={(name) => handlePageRename(activePageId, name)}
      onStartCollab={() => setShowCollabDialog(true)}
      onGenerate={handleGenerate}
      onExport={handleExport}
    />

    {currentPage === Page.Drawing && (
      <div className={styles.canvasArea}>
        <PageSidebar
          title="Sketch Pages"
          items={pages}
          activeItemId={activePageId}
          onSelectItem={setActivePageId}
          onRenameItem={handlePageRename}
          onDeleteItem={handleDeletePage}
          onAddItem={handleAddPage}
          onDuplicateItem={handleDuplicatePage}
          {...sidebarProps}
        />

        {pages.map(page => (
          <Drawing
            key={page.id}
            visible={page.id === activePageId}
            initialScene={page.scene}
            onSceneChange={handleSceneChange}
            ref={el => drawingRefs.current[page.id] = el}
          />
        ))}
      </div>
    )}

    {currentPage === Page.Mockup && (
      <Mockup
        mockups={mockups}
        activePageId={activeMockupId}
        onSelectPage={setActiveMockupId}
      />
    )}

    {loading && <LoadingSpinner />}

    <CollaborationDialog
      isOpen={showCollabDialog}
      onClose={() => setShowCollabDialog(false)}
      collabId={getCollabId()}
    />
  </div>
);
```

---

## Navbar Component

**File:** `frontend/src/App/Navbar.tsx`

**Purpose:** Top navigation bar with page switching, filename input, and action buttons.

### Props

```typescript
type Props = {
  curPage: Page;
  onPageChange: (p: Page) => void;
  filename?: string;
  onFilenameChange?: (name: string) => void;
  onStartCollab?: () => void;
  onGenerate?: () => void;
  onExport?: () => void;
};
```

| Prop | Type | Description |
|------|------|-------------|
| `curPage` | `Page` | Currently active page (Drawing or Mockup) |
| `onPageChange` | `(p: Page) => void` | Callback for page switches |
| `filename` | `string` (optional) | Current filename (default: "untitled.sketch") |
| `onFilenameChange` | `(name: string) => void` (optional) | Callback for filename changes |
| `onStartCollab` | `() => void` (optional) | Handler for "Collaborate" button |
| `onGenerate` | `() => void` (optional) | Handler for "Generate" button |
| `onExport` | `() => void` (optional) | Handler for "Export code" button |

### Usage Example

```tsx
<Navbar
  curPage={currentPage}
  onPageChange={setCurrentPage}
  filename="my-sketch.sketch"
  onFilenameChange={(name) => updateFilename(name)}
  onStartCollab={() => setShowDialog(true)}
  onGenerate={handleGenerate}
  onExport={handleExport}
/>
```

### Features

- **Logo Display:** "Sketch2Screen" branding
- **Editable Filename:** Input field with Enter-to-blur
- **Page Switcher:** Toggle between "Sketch" and "Design" views
- **Context-Aware Button:** Shows "Generate" in Drawing view, "Export code" in Mockup view
- **Collaborate Button:** Opens sharing dialog

---

## Drawing Component

**File:** `frontend/src/App/Drawing.tsx`

**Purpose:** Wraps Excalidraw library to provide sketch canvas with PNG export and scene management.

### Props

```typescript
interface DrawingProps {
  className?: string;
  width?: number;
  height?: number;
  visible?: boolean;
  initialScene?: SceneData;
  onSceneChange?: (scene: SceneData) => void;
  onExcalidrawAPI?: (api: any) => void;
}
```

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` (optional) | CSS class for styling |
| `width` | `number` (optional) | Canvas width |
| `height` | `number` (optional) | Canvas height |
| `visible` | `boolean` (optional) | Whether canvas is visible |
| `initialScene` | `SceneData` (optional) | Initial scene to load |
| `onSceneChange` | `(scene: SceneData) => void` (optional) | Callback when scene changes |
| `onExcalidrawAPI` | `(api: any) => void` (optional) | Receive Excalidraw API instance |

### Ref Methods (DrawingHandle)

```typescript
type DrawingHandle = {
  getPNGBlob: () => Promise<Blob | null>;
};
```

**getPNGBlob():**
- Exports current drawing as PNG blob
- Returns `null` if canvas is empty
- Includes white background for AI processing

### Usage Example

```tsx
const drawingRef = useRef<DrawingHandle>(null);

const exportToPNG = async () => {
  const blob = await drawingRef.current?.getPNGBlob();
  if (blob) {
    // Upload to backend or download
    const url = URL.createObjectURL(blob);
    // ...
  }
};

return (
  <Drawing
    ref={drawingRef}
    visible={isDrawingMode}
    initialScene={currentScene}
    onSceneChange={(scene) => updateScene(scene)}
  />
);
```

### Features

- **Excalidraw Integration:** Full-featured drawing canvas
- **Minimum Zoom Enforcement:** Prevents zoom below 1.0
- **Scene Change Detection:** Only fires callback when elements/files change (not view state)
- **PNG Export:** High-quality export with white background
- **Duplicate Call Prevention:** Caches last scene to avoid redundant updates

### Configuration

**UI Options (Disabled):**
- Change background color
- Load scene
- Save as image
- Export
- Toggle theme

---

## Mockup Component

**File:** `frontend/src/App/Mockup.tsx`

**Purpose:** Displays AI-generated HTML mockups with sidebar navigation and XSS protection.

### Props

```typescript
type Props = {
  mockups?: MockupPage[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
};
```

| Prop | Type | Description |
|------|------|-------------|
| `mockups` | `MockupPage[]` (optional) | Array of generated mockups |
| `activePageId` | `string \| null` | ID of currently displayed mockup |
| `onSelectPage` | `(id: string) => void` | Callback when mockup is selected |

### Types

```typescript
type MockupPage = {
  id: string;
  name: string;
  html: string;
};
```

### Usage Example

```tsx
<Mockup
  mockups={[
    { id: '1', name: 'Homepage', html: '<div>...</div>' },
    { id: '2', name: 'About', html: '<div>...</div>' }
  ]}
  activePageId="1"
  onSelectPage={(id) => setActiveMockupId(id)}
/>
```

### Features

- **XSS Protection:** Uses DOMPurify to sanitize HTML before rendering
- **Iframe Rendering:** Isolates generated HTML from main app
- **Sidebar Navigation:** Uses PageSidebar component (read-only mode)
- **Empty State:** Shows helpful message when no mockups exist

### Security

```typescript
const safeHtml = DOMPurify.sanitize(activeMockup.html);
```

All HTML is sanitized before injection to prevent XSS attacks.

---

## PageSidebar Component

**File:** `frontend/src/App/reusable_sidebar.tsx`

**Purpose:** Reusable sidebar for displaying and managing lists of pages/items.

### Props

```typescript
type Props<T extends SidebarItem> = {
  title: string;
  items: T[];
  activeItemId: string;
  onSelectItem: (id: string) => void;
  onRenameItem?: (id: string, name: string) => void;
  onDeleteItem?: (id: string) => void;
  onAddItem?: () => void;
  onDuplicateItem?: () => void;
  editingId: string | null;
  onSetEditingId: (id: string | null) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  showActions?: boolean;
  allowDelete?: boolean;
};
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Sidebar header title |
| `items` | `T[]` | Yes | Array of items to display |
| `activeItemId` | `string` | Yes | ID of active item |
| `onSelectItem` | `(id: string) => void` | Yes | Item selection callback |
| `onRenameItem` | `(id: string, name: string) => void` | No | Rename callback |
| `onDeleteItem` | `(id: string) => void` | No | Delete callback |
| `onAddItem` | `() => void` | No | Add new item callback |
| `onDuplicateItem` | `() => void` | No | Duplicate item callback |
| `editingId` | `string \| null` | Yes | ID of item being edited |
| `onSetEditingId` | `(id: string \| null) => void` | Yes | Set editing state |
| `expanded` | `boolean` | Yes | Sidebar expansion state |
| `onToggleExpanded` | `() => void` | Yes | Toggle expansion |
| `showActions` | `boolean` | No | Show action buttons (default: true) |
| `allowDelete` | `boolean` | No | Allow deletion (default: true) |

### Generic Type Constraint

```typescript
type SidebarItem = {
  id: string;
  name: string;
};
```

Items must have at minimum `id` and `name` properties.

### Usage Example - Sketch Pages

```tsx
<PageSidebar<SketchPage>
  title="Sketch Pages"
  items={pages}
  activeItemId={activePageId}
  onSelectItem={setActivePageId}
  onRenameItem={(id, name) => renamePage(id, name)}
  onDeleteItem={deletePage}
  onAddItem={addNewPage}
  onDuplicateItem={duplicateCurrentPage}
  editingId={editingPageId}
  onSetEditingId={setEditingPageId}
  expanded={sidebarExpanded}
  onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
  showActions={true}
  allowDelete={true}
/>
```

### Usage Example - Mockup Pages (Read-Only)

```tsx
<PageSidebar<MockupPage>
  title="Generated Pages"
  items={mockups}
  activeItemId={activeMockupId}
  onSelectItem={setActiveMockupId}
  editingId={null}
  onSetEditingId={() => {}}
  expanded={sidebarExpanded}
  onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
  showActions={false} // No add/duplicate in mockup view
  allowDelete={false} // No delete in mockup view
/>
```

### Features

- **Generic Type Support:** Works with any item type extending `SidebarItem`
- **Inline Rename:** Double-click to edit, Enter/Escape to finish
- **Delete Button:** Shows × button when hovering (minimum 1 item enforced)
- **Auto-Scroll:** Active item automatically scrolls into view
- **Expand/Collapse:** Toggle button to show/hide sidebar
- **Action Buttons:** Optional "New" and "Duplicate" buttons in footer

---

## CollaborationDialog Component

**File:** `frontend/src/App/CollaborationDialog.tsx`

**Purpose:** Modal dialog for displaying and sharing collaboration links.

### Props

```typescript
interface CollaborationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collabId: string;
}
```

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Whether dialog is visible |
| `onClose` | `() => void` | Callback to close dialog |
| `collabId` | `string` | Collaboration session ID |

### Usage Example

```tsx
const [showDialog, setShowDialog] = useState(false);
const collabId = "12345";

return (
  <>
    <button onClick={() => setShowDialog(true)}>
      Collaborate
    </button>

    <CollaborationDialog
      isOpen={showDialog}
      onClose={() => setShowDialog(false)}
      collabId={collabId}
    />
  </>
);
```

### Features

- **Auto-Generated URL:** Creates shareable link with `?collab=ID` parameter
- **Copy to Clipboard:** One-click copy with visual feedback
- **Fallback Support:** Uses `execCommand` for older browsers
- **Modal Overlay:** Click outside to close
- **Accessibility:** ARIA labels and keyboard support

### Generated URL Format

```
https://example.com/path?collab=12345
```

---

## LoadingSpinner Component

**File:** `frontend/src/App/LoadingScreen.tsx`

**Purpose:** Full-screen loading indicator shown during mockup generation.

### Component Signature

```typescript
export function LoadingSpinner(): JSX.Element
```

### Usage Example

```tsx
const [loading, setLoading] = useState(false);

return (
  <>
    <button onClick={async () => {
      setLoading(true);
      await generateMockups();
      setLoading(false);
    }}>
      Generate
    </button>

    {loading && <LoadingSpinner />}
  </>
);
```

### Features

- **Full-Screen Overlay:** Semi-transparent background
- **Centered Spinner:** Animated loading indicator
- **High Z-Index:** Appears above all other content
- **Non-Blocking:** Doesn't prevent JavaScript execution

---

## Helper Functions

### makeEmptyScene()

**Purpose:** Creates a blank Excalidraw scene with default settings.

**Signature:**
```typescript
function makeEmptyScene(): SceneData
```

**Returns:**
```typescript
{
  elements: [],
  appState: {
    viewBackgroundColor: "#ffffff",
    currentItemStrokeColor: "#000000",
    currentItemFillColor: "transparent",
    exportBackground: true,
    exportWithDarkMode: false,
  },
  files: {}
}
```

---

### makeNewSketchPage()

**Purpose:** Creates a new sketch page with default name and empty scene.

**Signature:**
```typescript
function makeNewSketchPage(index: number): SketchPage
```

**Parameters:**
- `index` (number) - Page number for default name

**Returns:**
```typescript
{
  id: crypto.randomUUID(),
  name: `Page ${index}`,
  scene: makeEmptyScene()
}
```

---

### getCollabId()

**Purpose:** Gets collaboration ID from URL or generates new timestamp-based ID.

**Signature:**
```typescript
function getCollabId(): string
```

**Returns:**
- URL parameter `collab` if present
- `Date.now().toString()` otherwise

**Example:**
```typescript
// URL: https://app.com/?collab=abc123
getCollabId(); // "abc123"

// URL: https://app.com/
getCollabId(); // "1699123456789" (timestamp)
```

