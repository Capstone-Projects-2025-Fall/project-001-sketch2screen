# Function: default()

> **default**(`props`): `Element`

Defined in: [Mockup.tsx:26](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/96530467301d960d36d6e993098335b81aa97167/frontend/src/App/Mockup.tsx#L26)

Displays the generated HTML/CSS mockup from the backend

## Parameters

### props

`Props`

Component properties

## Returns

`Element`

JSX element containing the mockup preview

## Example

```tsx
<Mockup html="<div>Generated content</div>" />
```

## Security

Uses DOMPurify to sanitize HTML and prevent XSS attacks
