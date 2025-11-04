# REST API Endpoints

Complete reference for all HTTP REST API endpoints in Sketch2Screen.

## Base URL

```
http://localhost:8000/api/
```

In production, replace with your deployed backend URL.

## Endpoint Summary

| Endpoint | Method | Purpose | Request Type | Response Type |
|----------|--------|---------|--------------|---------------|
| `/api/` | GET/POST/Any | Health check & connectivity test | - | JSON |
| `/api/generate/` | POST | Generate HTML/CSS from single image | multipart/form-data | JSON |
| `/api/generate-multi/` | POST | Generate HTML/CSS from multiple images | multipart/form-data | JSON |

---

## Endpoints

### GET/POST `/api/`

**Purpose:** Health check endpoint to verify frontend-backend connectivity.

**Authentication:** None required

**Request:** No parameters required

**Response:**

```json
{
  "status": "success",
  "message": "Backend is connected!",
  "method": "GET"
}
```

**Response Fields:**
- `status` (string) - Always "success"
- `message` (string) - Connection confirmation message
- `method` (string) - HTTP method used (GET, POST, etc.)

**Status Codes:**
- `200 OK` - Always returns success

**Example Usage:**

```javascript
// Test backend connection
const response = await fetch('/api/');
const data = await response.json();
console.log(data.message); // "Backend is connected!"
```

**cURL Example:**

```bash
curl http://localhost:8000/api/
```

---

### POST `/api/generate/`

**Purpose:** Generate HTML/CSS mockup from a single sketch image using Claude AI.

**Authentication:** None required

**Content-Type:** `multipart/form-data`

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file (PNG, JPG, etc.) of the sketch |
| `prompt` | String | No | Custom instruction for code generation |

**File Constraints:**
- Maximum size: 10MB (10,485,760 bytes)
- Allowed types: Any image MIME type (`image/png`, `image/jpeg`, etc.)
- Field name must be exactly `file`

**Request Example:**

```javascript
const blob = await drawingCanvas.exportToBlob();
const formData = new FormData();
formData.append('file', blob, 'sketch.png');

// Optional: Add custom prompt
formData.append('prompt', 'Make this design responsive and modern');

const response = await fetch('/api/generate/', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Success Response (200 OK):**

```json
{
  "html": "<div class=\"container\">...</div>"
}
```

**Response Fields:**
- `html` (string) - Generated HTML and CSS code as a single string

**Error Responses:**

**400 Bad Request - Missing File:**
```json
{
  "detail": "Missing file field 'file'."
}
```

**400 Bad Request - Invalid File Type:**
```json
{
  "detail": "Only images are supported."
}
```

**413 Request Entity Too Large:**
```json
{
  "detail": "File too large."
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Generation failed."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:8000/api/generate/ \
  -F "file=@sketch.png" \
  -F "prompt=Create a modern responsive design"
```

**Notes:**
- The generated HTML includes inline styles
- No `<body>` tags are included (inject into existing page)
- Bootstrap or Tailwind CSS may be used in the output
- Generation time varies (typically 3-10 seconds)
- Uses Claude model: `claude-sonnet-4-20250514`

---

### POST `/api/generate-multi/`

**Purpose:** Generate HTML/CSS mockups from multiple sketch images in a single batch request.

**Authentication:** None required

**Content-Type:** `multipart/form-data`

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `count` | String (number) | Yes | Number of files being uploaded (1-20) |
| `file_0`, `file_1`, ... | File | Yes | Image files, numbered sequentially from 0 |
| `name_0`, `name_1`, ... | String | No | Display names for each page (default: "Page N") |
| `id_0`, `id_1`, ... | String | No | Page IDs for matching results (default: "page_N") |

**Constraints:**
- Minimum count: 1
- Maximum count: 20
- Each file: Maximum 10MB, must be an image
- File field names must be exactly `file_0`, `file_1`, etc.

**Request Example:**

```javascript
const formData = new FormData();
formData.append('count', '3'); // Uploading 3 pages

// Add files with corresponding metadata
pages.forEach((page, index) => {
  const blob = await exportPageToBlob(page);
  formData.append(`file_${index}`, blob, `${page.name}.png`);
  formData.append(`name_${index}`, page.name);
  formData.append(`id_${index}`, page.id);
});

const response = await fetch('/api/generate-multi/', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Success Response (200 OK):**

```json
{
  "results": [
    {
      "id": "page-1",
      "html": "<div class=\"homepage\">...</div>"
    },
    {
      "id": "page-2",
      "html": "<div class=\"about\">...</div>"
    },
    {
      "id": "page-3",
      "html": "<div class=\"contact\">...</div>"
    }
  ]
}
```

**Response Fields:**
- `results` (array) - Array of result objects
  - `id` (string) - Page ID matching the request
  - `html` (string) - Generated HTML/CSS code
  - `error` (string, optional) - Error message if generation failed for this page

**Partial Success Response:**

If some files fail but others succeed:

```json
{
  "results": [
    {
      "id": "page-1",
      "html": "<div>...</div>"
    },
    {
      "id": "page-2",
      "html": "<p>Error: File too large.</p>",
      "error": "File too large."
    },
    {
      "id": "page-3",
      "html": "<p>Error generating mockup for About: API timeout</p>",
      "error": "Generation failed."
    }
  ]
}
```

**Error Responses:**

**400 Bad Request - Missing Count:**
```json
{
  "detail": "Missing 'count' field."
}
```

**400 Bad Request - Invalid Count:**
```json
{
  "detail": "Invalid count value"
}
```

**400 Bad Request - Count Out of Range:**
```json
{
  "detail": "Count must be between 1 and 20"
}
```

**400 Bad Request - No Valid Files:**
```json
{
  "detail": "No valid files provided."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:8000/api/generate-multi/ \
  -F "count=2" \
  -F "file_0=@home.png" \
  -F "name_0=Homepage" \
  -F "id_0=page-home" \
  -F "file_1=@about.png" \
  -F "name_1=About Us" \
  -F "id_1=page-about"
```

**Behavior Notes:**
- Files are processed **sequentially** (not in parallel)
- Missing files are skipped (no error if `file_3` is missing)
- Invalid files return an error object but don't fail the entire request
- Each file is validated independently
- Generation time scales linearly with file count (3-10 seconds per image)

**Performance Tips:**
- Limit batch sizes to 5-10 images for faster response times
- Use single generation endpoint for real-time feedback
- Consider client-side parallelization for many pages

---

## Common Patterns

### Error Handling

```javascript
async function generateMockup(blob) {
  try {
    const formData = new FormData();
    formData.append('file', blob, 'sketch.png');

    const response = await fetch('/api/generate/', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Generation failed');
    }

    const { html } = await response.json();
    return html;

  } catch (error) {
    console.error('Mockup generation error:', error);
    throw error;
  }
}
```

### Progress Tracking for Multi-page

```javascript
async function generateMultiplePages(pages) {
  const formData = new FormData();
  formData.append('count', pages.length.toString());

  pages.forEach((page, index) => {
    formData.append(`file_${index}`, page.blob);
    formData.append(`id_${index}`, page.id);
  });

  // Show loading state
  setLoading(true);
  setProgress(0);

  try {
    const response = await fetch('/api/generate-multi/', {
      method: 'POST',
      body: formData
    });

    const { results } = await response.json();

    // Process results
    results.forEach((result, index) => {
      if (result.error) {
        console.error(`Failed to generate ${pages[index].name}:`, result.error);
      } else {
        console.log(`Generated ${pages[index].name}`);
      }
      setProgress(((index + 1) / results.length) * 100);
    });

    return results;

  } finally {
    setLoading(false);
  }
}
```

### Retry Logic

```javascript
async function generateWithRetry(blob, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', blob, 'sketch.png');

      const response = await fetch('/api/generate/', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        return await response.json();
      }

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(await response.json().then(d => d.detail));
      }

      // Retry on server errors (5xx)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
}
```

## Related Documentation

- **[WebSocket API](websocket-api.md)** - Real-time collaboration protocol
- **[Internal Services](services.md)** - Claude Client implementation details
- **[Frontend Components](../frontend-api/components.md)** - React components that use these endpoints
