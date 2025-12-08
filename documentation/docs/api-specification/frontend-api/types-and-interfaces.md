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
