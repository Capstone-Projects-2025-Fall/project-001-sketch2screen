# Class: default

Defined in: [CollabClient.ts:5](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/CollabClient.ts#L5)

Client for handling real-time collaboration features

## Constructors

### Constructor

```ts
new default(collabID): CollabClient;
```

Defined in: [CollabClient.ts:22](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/CollabClient.ts#L22)

Creates a new collaboration client

#### Parameters

##### collabID

`number`

Unique identifier for this collaboration session

#### Returns

`CollabClient`

## Properties

### collabID

```ts
collabID: number;
```

Defined in: [CollabClient.ts:7](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/CollabClient.ts#L7)

Unique identifier for this collaboration session

***

### connection

```ts
connection: WebSocket;
```

Defined in: [CollabClient.ts:11](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/CollabClient.ts#L11)

Connection to server

***

### pageUpdateHandler

```ts
pageUpdateHandler: (sketchID, name) => void | null = null;
```

Defined in: [CollabClient.ts:15](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/CollabClient.ts#L15)

***

### sceneUpdateHandler

```ts
sceneUpdateHandler: (sketchID, sceneData) => void | null = null;
```

Defined in: [CollabClient.ts:14](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/CollabClient.ts#L14)

## Methods

### sendPageUpdate()

```ts
sendPageUpdate(sketchID, pageName): void;
```

Defined in: [CollabClient.ts:133](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/CollabClient.ts#L133)

Sends page updates to other clients

#### Parameters

##### sketchID

`string`

ID of the sketch page being updated

##### pageName

New name for the page, or null if page is being deleted

`string` | `null`

#### Returns

`void`

***

### sendSceneUpdate()

```ts
sendSceneUpdate(sketchID, sceneData): void;
```

Defined in: [CollabClient.ts:89](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/CollabClient.ts#L89)

Sends scene updates to other clients

#### Parameters

##### sketchID

`string`

ID of the sketch being updated

##### sceneData

[`SceneData`](../../Drawing/type-aliases/SceneData.md)

New scene data to send to collaborators

#### Returns

`void`

***

### setPageUpdateHandler()

```ts
setPageUpdateHandler(handler): void;
```

Defined in: [CollabClient.ts:123](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/CollabClient.ts#L123)

Sets up handler for receiving page updates from other clients

#### Parameters

##### handler

(`sketchID`, `name`) => `void`

Callback function that processes received page updates

#### Returns

`void`

***

### setSceneUpdateHandler()

```ts
setSceneUpdateHandler(handler): void;
```

Defined in: [CollabClient.ts:79](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/CollabClient.ts#L79)

Sets up handler for receiving scene updates from other clients

#### Parameters

##### handler

(`sketchID`, `sceneData`) => `void`

Callback function that processes received scene updates

#### Returns

`void`
