# Interface: UseCollaborationParams

Defined in: [useCollaboration.ts:6](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/useCollaboration.ts#L6)

## Properties

### activePageId

```ts
activePageId: string;
```

Defined in: [useCollaboration.ts:12](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/useCollaboration.ts#L12)

ID of the currently active page

***

### activePageIdRef

```ts
activePageIdRef: MutableRefObject<string>;
```

Defined in: [useCollaboration.ts:14](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/useCollaboration.ts#L14)

Ref that tracks the current active page ID

***

### canvasHostRef?

```ts
optional canvasHostRef: RefObject<HTMLDivElement | null>;
```

Defined in: [useCollaboration.ts:24](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/useCollaboration.ts#L24)

Optional ref to the canvas host element for pointer event handling

***

### collabId

```ts
collabId: string;
```

Defined in: [useCollaboration.ts:8](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/useCollaboration.ts#L8)

Initial collaboration ID from URL or generated

***

### makeEmptyScene()

```ts
makeEmptyScene: () => SceneData;
```

Defined in: [useCollaboration.ts:22](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/useCollaboration.ts#L22)

Function to create an empty scene

#### Returns

[`SceneData`](../../Drawing/type-aliases/SceneData.md)

***

### pages

```ts
pages: SketchPage[];
```

Defined in: [useCollaboration.ts:10](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/useCollaboration.ts#L10)

Current pages in the application

***

### setActivePageId

```ts
setActivePageId: Dispatch<SetStateAction<string>>;
```

Defined in: [useCollaboration.ts:18](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/useCollaboration.ts#L18)

Setter for active page ID

***

### setEditingId

```ts
setEditingId: Dispatch<SetStateAction<string | null>>;
```

Defined in: [useCollaboration.ts:20](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/useCollaboration.ts#L20)

Setter for editing ID

***

### setPages

```ts
setPages: Dispatch<SetStateAction<SketchPage[]>>;
```

Defined in: [useCollaboration.ts:16](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/useCollaboration.ts#L16)

Setter for pages state
