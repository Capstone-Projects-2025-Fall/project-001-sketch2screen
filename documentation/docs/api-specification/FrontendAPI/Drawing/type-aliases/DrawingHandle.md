# Type Alias: DrawingHandle

```ts
type DrawingHandle = object;
```

Defined in: [Drawing.tsx:16](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f2fa4c469a76932c2c8884a793c4f4a963f0d268/frontend/src/App/Drawing.tsx#L16)

Interface for methods exposed to parent components via ref

## Properties

### getPNGBlob()

```ts
getPNGBlob: () => Promise<Blob | null>;
```

Defined in: [Drawing.tsx:18](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f2fa4c469a76932c2c8884a793c4f4a963f0d268/frontend/src/App/Drawing.tsx#L18)

Exports the current drawing as a PNG blob

#### Returns

`Promise`\<`Blob` \| `null`\>
