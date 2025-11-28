# Type Alias: DrawingHandle

```ts
type DrawingHandle = object;
```

Defined in: [Drawing.tsx:18](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/Drawing.tsx#L18)

Interface for methods exposed to parent components via ref

## Properties

### getPNGBlob()

```ts
getPNGBlob: () => Promise<Blob | null>;
```

Defined in: [Drawing.tsx:20](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f0486efd46c54f7252aea12b6834a9740f6f9ac7/frontend/src/App/Drawing.tsx#L20)

Exports the current drawing as a PNG blob

#### Returns

`Promise`\<`Blob` \| `null`\>
