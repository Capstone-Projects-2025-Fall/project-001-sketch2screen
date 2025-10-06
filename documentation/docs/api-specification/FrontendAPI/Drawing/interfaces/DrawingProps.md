# Interface: DrawingProps

Defined in: [Drawing.tsx:22](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/8c59e38046a6d7468c87cefbc528234a59134c77/frontend/src/App/Drawing.tsx#L22)

Props for the Drawing component

## Properties

### className?

```ts
optional className: string;
```

Defined in: [Drawing.tsx:24](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/8c59e38046a6d7468c87cefbc528234a59134c77/frontend/src/App/Drawing.tsx#L24)

CSS class name for styling

***

### height?

```ts
optional height: number;
```

Defined in: [Drawing.tsx:28](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/8c59e38046a6d7468c87cefbc528234a59134c77/frontend/src/App/Drawing.tsx#L28)

Height of the drawing canvas

***

### initialScene?

```ts
optional initialScene: SceneData;
```

Defined in: [Drawing.tsx:32](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/8c59e38046a6d7468c87cefbc528234a59134c77/frontend/src/App/Drawing.tsx#L32)

Initial scene data to load

***

### onSceneChange()?

```ts
optional onSceneChange: (scene) => void;
```

Defined in: [Drawing.tsx:34](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/8c59e38046a6d7468c87cefbc528234a59134c77/frontend/src/App/Drawing.tsx#L34)

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

Defined in: [Drawing.tsx:30](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/8c59e38046a6d7468c87cefbc528234a59134c77/frontend/src/App/Drawing.tsx#L30)

Whether the drawing canvas is visible

***

### width?

```ts
optional width: number;
```

Defined in: [Drawing.tsx:26](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/8c59e38046a6d7468c87cefbc528234a59134c77/frontend/src/App/Drawing.tsx#L26)

Width of the drawing canvas
