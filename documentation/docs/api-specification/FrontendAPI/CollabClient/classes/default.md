# Class: default

Defined in: [CollabClient.ts:4](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f6427b83281d7a02723fc969f7748696727ec7bf/frontend/src/App/CollabClient.ts#L4)

Client for handling real-time collaboration features

## Constructors

### Constructor

```ts
new default(collabID): CollabClient;
```

Defined in: [CollabClient.ts:12](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f6427b83281d7a02723fc969f7748696727ec7bf/frontend/src/App/CollabClient.ts#L12)

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

Defined in: [CollabClient.ts:6](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f6427b83281d7a02723fc969f7748696727ec7bf/frontend/src/App/CollabClient.ts#L6)

Unique identifier for this collaboration session

## Methods

### sendPageUpdate()

```ts
sendPageUpdate(sketchID, name): void;
```

Defined in: [CollabClient.ts:47](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f6427b83281d7a02723fc969f7748696727ec7bf/frontend/src/App/CollabClient.ts#L47)

Sends page updates to other clients

#### Parameters

##### sketchID

`number`

ID of the sketch page being updated

##### name

New name for the page, or null if page is being deleted

`null` | `string`

#### Returns

`void`

***

### sendSceneUpdate()

```ts
sendSceneUpdate(sketchID, sceneData): void;
```

Defined in: [CollabClient.ts:30](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f6427b83281d7a02723fc969f7748696727ec7bf/frontend/src/App/CollabClient.ts#L30)

Sends scene updates to other clients

#### Parameters

##### sketchID

`number`

ID of the sketch being updated

##### sceneData

`SceneData`

New scene data to send to collaborators

#### Returns

`void`

***

### setPageUpdateHandler()

```ts
setPageUpdateHandler(handler): void;
```

Defined in: [CollabClient.ts:39](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f6427b83281d7a02723fc969f7748696727ec7bf/frontend/src/App/CollabClient.ts#L39)

Sets up handler for receiving page updates from other clients

#### Parameters

##### handler

(`sketchID`, `name`) => `void`

Callback function that processes received page updates

#### Returns

`void`

***

### setUpdateHandler()

```ts
setUpdateHandler(handler): void;
```

Defined in: [CollabClient.ts:22](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f6427b83281d7a02723fc969f7748696727ec7bf/frontend/src/App/CollabClient.ts#L22)

Sets up handler for receiving scene updates from other clients

#### Parameters

##### handler

(`sketchID`, `sceneData`) => `void`

Callback function that processes received scene updates

#### Returns

`void`
