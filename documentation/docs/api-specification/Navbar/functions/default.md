# Function: default()

> **default**(`props`): `Element`

Defined in: [Navbar.tsx:41](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/96530467301d960d36d6e993098335b81aa97167/frontend/src/App/Navbar.tsx#L41)

Navigation bar component with page switching and actions

## Parameters

### props

`Props`

Component properties

## Returns

`Element`

JSX element containing the navigation bar

## Example

```tsx
<Navbar 
  curPage={Page.Drawing}
  onPageChange={setCurrentPage}
  filename="my-sketch.sketch"
  onFilenameChange={handleNameChange}
/>
```
