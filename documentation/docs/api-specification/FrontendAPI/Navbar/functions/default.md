# Function: default()

```ts
function default(props): Element;
```

Defined in: [Navbar.tsx:43](https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen/blob/929dae097d12dcbdde838a32563a914feada263a/frontend/src/App/Navbar.tsx#L43)

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
