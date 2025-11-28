# Interface: DrawingProps

Defined in: [Drawing.tsx:24](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/Drawing.tsx#L24)

## Properties

### className?

```ts
optional className: string;
```

Defined in: [Drawing.tsx:26](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/Drawing.tsx#L26)

CSS class name for styling

***

### height?

```ts
optional height: number;
```

Defined in: [Drawing.tsx:30](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/Drawing.tsx#L30)

Height of the drawing canvas

***

### initialScene?

```ts
optional initialScene: SceneData;
```

Defined in: [Drawing.tsx:34](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/Drawing.tsx#L34)

Initial scene data to load

***

### onExcalidrawAPI()?

```ts
optional onExcalidrawAPI: (api) => void;
```

Defined in: [Drawing.tsx:38](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/Drawing.tsx#L38)

Callback to receive Excalidraw API

#### Parameters

##### api

`any`

#### Returns

`void`

***

### onSceneChange()?

```ts
optional onSceneChange: (scene) => void;
```

Defined in: [Drawing.tsx:36](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/Drawing.tsx#L36)

Callback fired when the scene changes

#### Parameters

##### scene

[`SceneData`](../type-aliases/SceneData.md)

#### Returns

`void`

***

### visible?

```ts
optional visible: boolean;
```

Defined in: [Drawing.tsx:32](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/Drawing.tsx#L32)

Whether the drawing canvas is visible

***

### width?

```ts
optional width: number;
```

Defined in: [Drawing.tsx:28](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/Drawing.tsx#L28)

Width of the drawing canvas
