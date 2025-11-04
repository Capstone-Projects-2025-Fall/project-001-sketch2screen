# Types & Interfaces

TypeScript type definitions used throughout the Sketch2Screen frontend.

## Table of Contents

- [Enums](#enums)
  - [Page](#page-enum)
- [Core Types](#core-types)
  - [SceneData](#scenedata-type)
  - [SketchPage](#sketchpage-type)
  - [MockupPage](#mockuppage-type)
  - [SidebarItem](#sidebaritem-type)
- [Component Props](#component-props)
  - [DrawingProps](#drawingprops-interface)
  - [DrawingHandle](#drawinghandle-type)
  - [NavbarProps](#navbarprops-type)
  - [MockupProps](#mockupprops-type)
  - [PageSidebarProps](#pagesidebarprops-type)
  - [CollaborationDialogProps](#collaborationdialogprops-interface)

---

## Enums

### Page Enum

**File:** `frontend/src/App/App.tsx`

**Purpose:** Represents the available views/pages in the application.

```typescript
export enum Page {
  Drawing,
  Mockup
}
```

**Values:**
- `Page.Drawing` (0) - Sketch canvas view
- `Page.Mockup` (1) - Generated mockup display view

**Usage:**
```typescript
const [currentPage, setCurrentPage] = useState<Page>(Page.Drawing);

if (currentPage === Page.Drawing) {
  return <Drawing />;
} else {
  return <Mockup />;
}
```

---

## Core Types

### SceneData Type

**File:** `frontend/src/App/Drawing.tsx`

**Purpose:** Represents a complete Excalidraw scene with all its components.

```typescript
export type SceneData = {
  /** Array of drawing elements */
  elements: readonly any[];
  /** Application state including view settings */
  appState: any;
  /** Map of binary files (like images) used in the scene */
  files: Record<string, any>;
};
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `elements` | `readonly any[]` | Array of Excalidraw drawing elements (rectangles, arrows, text, etc.) |
| `appState` | `any` | Excalidraw application state (zoom, colors, background, etc.) |
| `files` | `Record<string, any>` | Binary files embedded in the scene (images, etc.) |

**Example:**
```typescript
const scene: SceneData = {
  elements: [
    {
      type: "rectangle",
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      strokeColor: "#000000",
      // ... other properties
    }
  ],
  appState: {
    viewBackgroundColor: "#ffffff",
    zoom: { value: 1 },
    currentItemStrokeColor: "#000000",
    // ... other state
  },
  files: {}
};
```

**Empty Scene:**
```typescript
const emptyScene: SceneData = {
  elements: [],
  appState: {
    viewBackgroundColor: "#ffffff",
    currentItemStrokeColor: "#000000",
    currentItemFillColor: "transparent",
    exportBackground: true,
    exportWithDarkMode: false,
  },
  files: {}
};
```

---

### SketchPage Type

**File:** `frontend/src/App/App.tsx`

**Purpose:** Represents a single sketch page with its metadata and drawing content.

```typescript
type SketchPage = {
  /** Unique identifier for the page */
  id: string;
  /** Display name of the page */
  name: string;
  /** Excalidraw scene data containing elements, state and files */
  scene: SceneData;
};
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (UUID or deterministic ID for collaboration) |
| `name` | `string` | User-editable display name shown in sidebar |
| `scene` | `SceneData` | Excalidraw scene containing all drawing elements |

**Example:**
```typescript
const page: SketchPage = {
  id: "12345-p1",
  name: "Homepage Design",
  scene: {
    elements: [...],
    appState: {...},
    files: {}
  }
};
```

**Creating New Pages:**
```typescript
const newPage: SketchPage = {
  id: crypto.randomUUID(),
  name: `Page ${pages.length + 1}`,
  scene: makeEmptyScene()
};
```

**Deterministic IDs for Collaboration:**
```typescript
const firstPage: SketchPage = {
  id: `${collabID}-p1`, // e.g., "12345-p1"
  name: "Page 1",
  scene: makeEmptyScene()
};
```

---

### MockupPage Type

**File:** `frontend/src/App/Mockup.tsx`

**Purpose:** Represents a generated HTML mockup page.

```typescript
export type MockupPage = {
  /** Unique identifier */
  id: string;
  /** Name of sketch page */
  name: string;
  /** HTML content of the mockup */
  html: string;
};
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier matching the original sketch page |
| `name` | `string` | Display name (usually matches the sketch page name) |
| `html` | `string` | Generated HTML/CSS code from Claude AI |

**Example:**
```typescript
const mockup: MockupPage = {
  id: "page-1",
  name: "Homepage",
  html: `
    <div style="padding: 20px;">
      <h1>Welcome</h1>
      <p>Homepage content...</p>
    </div>
  `
};
```

**From Backend Response:**
```typescript
const response = await fetch('/api/generate-multi/', {...});
const { results } = await response.json();

const mockups: MockupPage[] = results.map((r: any) => ({
  id: r.id,
  name: pages.find(p => p.id === r.id)?.name || 'Untitled',
  html: r.html
}));
```

---

### SidebarItem Type

**File:** `frontend/src/App/reusable_sidebar.tsx`

**Purpose:** Generic type for items displayable in the sidebar component.

```typescript
export type SidebarItem = {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
};
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier for the item |
| `name` | `string` | Display text shown in sidebar |

**Usage:**

Both `SketchPage` and `MockupPage` extend this type:

```typescript
// SketchPage extends SidebarItem
type SketchPage = SidebarItem & {
  scene: SceneData;
};

// MockupPage extends SidebarItem
type MockupPage = SidebarItem & {
  html: string;
};
```

**Generic Component:**
```typescript
function PageSidebar<T extends SidebarItem>(props: Props<T>) {
  // Works with any type that has id and name
}

// Used with SketchPage
<PageSidebar<SketchPage> items={sketchPages} {...} />

// Used with MockupPage
<PageSidebar<MockupPage> items={mockupPages} {...} />
```

---

## Component Props

### DrawingProps Interface

**File:** `frontend/src/App/Drawing.tsx`

**Purpose:** Props for the Drawing component.

```typescript
export interface DrawingProps {
  /** CSS class name for styling */
  className?: string;
  /** Width of the drawing canvas */
  width?: number;
  /** Height of the drawing canvas */
  height?: number;
  /** Whether the drawing canvas is visible */
  visible?: boolean;
  /** Initial scene data to load */
  initialScene?: SceneData;
  /** Callback fired when the scene changes */
  onSceneChange?: (scene: SceneData) => void;
  /** Callback to receive Excalidraw API */
  onExcalidrawAPI?: (api: any) => void;
}
```

**All Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `className` | `string` | No | - | CSS class for custom styling |
| `width` | `number` | No | - | Canvas width in pixels |
| `height` | `number` | No | - | Canvas height in pixels |
| `visible` | `boolean` | No | `true` | Controls display via CSS |
| `initialScene` | `SceneData` | No | Empty | Initial drawing to load |
| `onSceneChange` | `(scene: SceneData) => void` | No | - | Called when scene changes |
| `onExcalidrawAPI` | `(api: any) => void` | No | - | Receives Excalidraw API instance |

**Example:**
```typescript
<Drawing
  className={styles.canvas}
  visible={currentPage === Page.Drawing}
  initialScene={pages[activePageId].scene}
  onSceneChange={(scene) => updatePageScene(activePageId, scene)}
/>
```

---

### DrawingHandle Type

**File:** `frontend/src/App/Drawing.tsx`

**Purpose:** Interface for methods exposed to parent components via ref.

```typescript
export type DrawingHandle = {
  /** Exports the current drawing as a PNG blob */
  getPNGBlob: () => Promise<Blob | null>;
};
```

**Methods:**

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `getPNGBlob` | `() => Promise<Blob \| null>` | PNG blob or null | Exports canvas as PNG image |

**Usage:**
```typescript
const drawingRef = useRef<DrawingHandle>(null);

const exportToPNG = async () => {
  const blob = await drawingRef.current?.getPNGBlob();
  if (blob) {
    // Upload or download
    const formData = new FormData();
    formData.append('file', blob, 'sketch.png');
    await fetch('/api/generate/', { method: 'POST', body: formData });
  }
};

return <Drawing ref={drawingRef} {...} />;
```

---

### NavbarProps Type

**File:** `frontend/src/App/Navbar.tsx`

**Purpose:** Props for the Navbar component.

```typescript
type Props = {
  /** Current active page */
  curPage: Page;
  /** Callback for page change events */
  onPageChange: (p: Page) => void;
  /** Current filename being edited */
  filename?: string;
  /** Callback for filename change events */
  onFilenameChange?: (name: string) => void;
  /** Callback to initiate collaboration */
  onStartCollab?: () => void;
  /** Callback to generate mockup */
  onGenerate?: () => void;
  /** Callback to export code */
  onExport?: () => void;
};
```

**All Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `curPage` | `Page` | Yes | - | Currently active page view |
| `onPageChange` | `(p: Page) => void` | Yes | - | Page switch handler |
| `filename` | `string` | No | `"untitled.sketch"` | Editable filename |
| `onFilenameChange` | `(name: string) => void` | No | - | Filename change handler |
| `onStartCollab` | `() => void` | No | - | "Collaborate" button handler |
| `onGenerate` | `() => void` | No | - | "Generate" button handler |
| `onExport` | `() => void` | No | - | "Export code" button handler |

---

### MockupProps Type

**File:** `frontend/src/App/Mockup.tsx`

**Purpose:** Props for the Mockup component.

```typescript
type Props = {
  /** Array of generated mockups to display */
  mockups?: MockupPage[];
  /** ID of currently active mockup */
  activePageId: string | null;
  /** Callback when mockup is selected */
  onSelectPage: (id: string) => void;
};
```

**All Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `mockups` | `MockupPage[]` | No | `[]` | Array of generated HTML mockups |
| `activePageId` | `string \| null` | Yes | - | ID of mockup to display |
| `onSelectPage` | `(id: string) => void` | Yes | - | Mockup selection handler |

---

### PageSidebarProps Type

**File:** `frontend/src/App/reusable_sidebar.tsx`

**Purpose:** Props for the generic PageSidebar component.

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

**All Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `title` | `string` | Yes | - | Sidebar header title |
| `items` | `T[]` | Yes | - | Array of items to display |
| `activeItemId` | `string` | Yes | - | ID of currently active item |
| `onSelectItem` | `(id: string) => void` | Yes | - | Item selection handler |
| `onRenameItem` | `(id, name) => void` | No | - | Rename handler |
| `onDeleteItem` | `(id: string) => void` | No | - | Delete handler |
| `onAddItem` | `() => void` | No | - | Add new item handler |
| `onDuplicateItem` | `() => void` | No | - | Duplicate item handler |
| `editingId` | `string \| null` | Yes | - | ID of item being edited |
| `onSetEditingId` | `(id \| null) => void` | Yes | - | Set editing state |
| `expanded` | `boolean` | Yes | - | Sidebar expansion state |
| `onToggleExpanded` | `() => void` | Yes | - | Toggle expansion handler |
| `showActions` | `boolean` | No | `true` | Show action buttons |
| `allowDelete` | `boolean` | No | `true` | Allow item deletion |

**Generic Type Parameter:**

The component is generic over `T extends SidebarItem`:

```typescript
<PageSidebar<SketchPage>
  items={sketchPages}
  // ... other props
/>

<PageSidebar<MockupPage>
  items={mockupPages}
  // ... other props
/>
```

---

### CollaborationDialogProps Interface

**File:** `frontend/src/App/CollaborationDialog.tsx`

**Purpose:** Props for the CollaborationDialog component.

```typescript
interface CollaborationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Current collaboration ID */
  collabId: string;
}
```

**All Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls dialog visibility |
| `onClose` | `() => void` | Yes | Close dialog handler |
| `collabId` | `string` | Yes | Collaboration session ID for URL generation |

**Example:**
```typescript
<CollaborationDialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  collabId="12345"
/>
```

---

## Utility Types

### ExcalidrawAPI Type

**File:** `frontend/src/App/Drawing.tsx` (internal)

**Purpose:** Type representing Excalidraw's API methods.

```typescript
type ExcalidrawAPI = NonNullable<
  Parameters<
    NonNullable<React.ComponentProps<typeof Excalidraw>["excalidrawAPI"]>
  >[0]
>;
```

**Common Methods:**

| Method | Description |
|--------|-------------|
| `getSceneElements()` | Returns all drawing elements |
| `getAppState()` | Returns current application state |
| `getFiles()` | Returns embedded files/images |
| `updateScene(data)` | Updates scene programmatically |

**Usage:**
```typescript
const excaliRef = useRef<ExcalidrawAPI | null>(null);

// In Excalidraw component:
<Excalidraw
  excalidrawAPI={(api) => {
    excaliRef.current = api;
  }}
/>

// Later:
const elements = excaliRef.current?.getSceneElements();
```

---

## Type Guards

### Checking Page Type

```typescript
function isSketchPage(item: SidebarItem): item is SketchPage {
  return 'scene' in item;
}

function isMockupPage(item: SidebarItem): item is MockupPage {
  return 'html' in item;
}

// Usage:
if (isSketchPage(item)) {
  console.log(item.scene.elements);
}
```

---

## Type Conversions

### SketchPage to MockupPage

```typescript
function convertToMockup(
  sketch: SketchPage,
  generatedHtml: string
): MockupPage {
  return {
    id: sketch.id,
    name: sketch.name,
    html: generatedHtml
  };
}
```

### Backend Response to MockupPage

```typescript
interface BackendResult {
  id: string;
  html: string;
  error?: string;
}

function parseBackendResults(
  results: BackendResult[],
  sketches: SketchPage[]
): MockupPage[] {
  return results
    .filter(r => !r.error)
    .map(r => ({
      id: r.id,
      name: sketches.find(s => s.id === r.id)?.name || 'Untitled',
      html: r.html
    }));
}
```

---

## Related Documentation

- **[Frontend Components](components.md)** - How these types are used in components
- **[CollabClient](collaboration-client.md)** - Collaboration-specific types
- **[Backend API](../backend-api/rest-endpoints.md)** - Backend data formats
