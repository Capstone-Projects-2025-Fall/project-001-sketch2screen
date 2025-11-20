# Interface: UseCollaborationReturn

Defined in: [useCollaboration.ts:27](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L27)

## Properties

### collabClientRef

```ts
collabClientRef: MutableRefObject<default | null>;
```

Defined in: [useCollaboration.ts:37](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L37)

Ref to the CollabClient instance

***

### collabEnabled

```ts
collabEnabled: boolean;
```

Defined in: [useCollaboration.ts:29](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L29)

Whether collaboration is currently enabled

***

### collabId

```ts
collabId: string;
```

Defined in: [useCollaboration.ts:33](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L33)

The collaboration ID

***

### handleCloseCollabDialog()

```ts
handleCloseCollabDialog: () => void;
```

Defined in: [useCollaboration.ts:45](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L45)

Function to close collaboration dialog

#### Returns

`void`

***

### handleCollabSceneChange()

```ts
handleCollabSceneChange: (scene, oldScene?) => void;
```

Defined in: [useCollaboration.ts:47](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L47)

Callback to handle scene changes with collaboration

#### Parameters

##### scene

[`SceneData`](../../Drawing/type-aliases/SceneData.md)

##### oldScene?

[`SceneData`](../../Drawing/type-aliases/SceneData.md)

#### Returns

`void`

***

### handleShowCollaboration()

```ts
handleShowCollaboration: () => void;
```

Defined in: [useCollaboration.ts:43](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L43)

Function to show collaboration dialog

#### Returns

`void`

***

### isDrawingRef

```ts
isDrawingRef: MutableRefObject<boolean>;
```

Defined in: [useCollaboration.ts:39](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L39)

Ref tracking if user is currently drawing

***

### notifyPageAdded()

```ts
notifyPageAdded: (pageId, pageName) => void;
```

Defined in: [useCollaboration.ts:49](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L49)

Callback to notify collaboration of new page

#### Parameters

##### pageId

`string`

##### pageName

`string`

#### Returns

`void`

***

### notifyPageDeleted()

```ts
notifyPageDeleted: (pageId) => void;
```

Defined in: [useCollaboration.ts:55](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L55)

Callback to notify collaboration of page deletion

#### Parameters

##### pageId

`string`

#### Returns

`void`

***

### notifyPageDuplicated()

```ts
notifyPageDuplicated: (pageId, pageName, scene) => void;
```

Defined in: [useCollaboration.ts:51](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L51)

Callback to notify collaboration of page duplicate

#### Parameters

##### pageId

`string`

##### pageName

`string`

##### scene

[`SceneData`](../../Drawing/type-aliases/SceneData.md)

#### Returns

`void`

***

### notifyPageRenamed()

```ts
notifyPageRenamed: (pageId, pageName) => void;
```

Defined in: [useCollaboration.ts:53](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L53)

Callback to notify collaboration of page rename

#### Parameters

##### pageId

`string`

##### pageName

`string`

#### Returns

`void`

***

### pendingSceneRef

```ts
pendingSceneRef: MutableRefObject<
  | {
  pageId: string;
  scene: SceneData;
}
| null>;
```

Defined in: [useCollaboration.ts:41](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L41)

Ref for pending scene data to send after stroke completes

***

### sceneVersion

```ts
sceneVersion: number;
```

Defined in: [useCollaboration.ts:35](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L35)

Current scene version (increments on remount)

***

### showCollabDialog

```ts
showCollabDialog: boolean;
```

Defined in: [useCollaboration.ts:31](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/useCollaboration.ts#L31)

Whether to show the collaboration dialog
