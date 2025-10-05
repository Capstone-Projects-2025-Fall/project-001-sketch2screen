# Function: Collector()

```ts
function Collector(input): HTMLElement[];
```

Defined in: [Collector.tsx:14](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/f2fa4c469a76932c2c8884a793c4f4a963f0d268/frontend/src/App/Collector.tsx#L14)

Parses HTML string into an array of DOM elements

## Parameters

### input

`string`

Raw HTML string to parse

## Returns

`HTMLElement`[]

Array of HTMLElement objects extracted from the parsed document body

## Example

```ts
const html = "<div>Hello</div><p>World</p>";
const elements = Collector(html);
// Returns [HTMLDivElement, HTMLParagraphElement]
```
