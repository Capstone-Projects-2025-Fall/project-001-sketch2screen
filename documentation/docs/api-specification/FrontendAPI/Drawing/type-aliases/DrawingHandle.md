# Type Alias: DrawingHandle

```ts
type DrawingHandle = object;
```

Defined in: [Drawing.tsx:16](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f6427b83281d7a02723fc969f7748696727ec7bf/frontend/src/App/Drawing.tsx#L16)

Interface for methods exposed to parent components via ref

## Properties

### getPNGBlob()

```ts
getPNGBlob: () => Promise<Blob | null>;
```

Defined in: [Drawing.tsx:18](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f6427b83281d7a02723fc969f7748696727ec7bf/frontend/src/App/Drawing.tsx#L18)

Exports the current drawing as a PNG blob

#### Returns

`Promise`\<`Blob` \| `null`\>
