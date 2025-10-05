# Backend API

## Overview

This document provides comprehensive documentation for the backend API components, including views, services, and collaboration server functionality.

---

## Views Module (`views.py`)

### Functions

#### `test_api(request)`

**Purpose:** Simple test endpoint to verify frontend-backend connection and ensure the API is responding correctly.

**Parameters:**
- `request` (HttpRequest): Django HTTP request object

**Return Value:**
- JsonResponse: JSON object containing status, message, and HTTP method
  ```json
  {
    "status": "success",
    "message": "Backend is connected!",
    "method": "GET|POST|etc"
  }
  ```

**Pre-conditions:** None

**Post-conditions:** Returns a successful JSON response regardless of request method

**Exceptions Thrown:** None

---

#### `generate_mockup(request)`

**Purpose:** Placeholder endpoint for sketch-to-mockup generation functionality. Currently returns a mock response to confirm button click processing.

**Parameters:**
- `request` (HttpRequest): Django HTTP request object

**Return Value:**
- JsonResponse: Success response for POST requests with mockup ID
  ```json
  {
    "status": "success",
    "message": "Generate button clicked - AI processing would happen here",
    "mockup_id": "mock_123"
  }
  ```
- JsonResponse: Error response for non-POST requests (status 405)
  ```json
  {
    "error": "Method not allowed"
  }
  ```

**Pre-conditions:**
- Request method should be POST for successful processing

**Post-conditions:**
- Returns mock success response for POST requests
- Returns 405 error for other HTTP methods

**Exceptions Thrown:** None (handled via status codes)

---

#### `frontend(request)`

**Purpose:** Renders the frontend HTML template for the application.

**Parameters:**
- `request` (HttpRequest): Django HTTP request object

**Return Value:**
- HttpResponse: Rendered HTML template from 'frontend/src/index.html'

**Pre-conditions:**
- Template file must exist at 'frontend/src/index.html'

**Post-conditions:** Returns rendered HTML page

**Exceptions Thrown:**
- `TemplateDoesNotExist`: If the template file is not found

---

### Classes

#### `GenerateView`

**Purpose:** API view class that handles image upload and converts sketches to HTML/CSS mockups using Claude AI.

**Inheritance:** Inherits from `rest_framework.views.APIView`

**Decorators:**
- `@method_decorator(csrf_exempt, name="dispatch")`: Exempts this view from CSRF validation

**Data Fields:**
- `parser_classes` (list): Set to `[MultiPartParser]` to accept multipart/form-data for file uploads
- `MAX_BYTES` (int, module-level): 10485760 (10MB) - Maximum allowed file upload size

**Methods:**

##### `post(self, request)`

**Purpose:** Handles POST requests containing image file uploads, validates the file, and generates HTML/CSS mockup using Claude AI.

**Parameters:**
- `request` (Request): DRF Request object containing uploaded file and optional prompt

**Return Value:**
- Response: DRF Response object with one of the following:
  - Success (200): `{"html": "<generated_html_string>"}`
  - Bad Request (400): `{"detail": "Missing file field 'file'."}`
  - Bad Request (400): `{"detail": "Only images are supported."}`
  - Request Entity Too Large (413): `{"detail": "File too large."}`
  - Internal Server Error (500): `{"detail": "Generation failed."}`

**Pre-conditions:**
- Request must include a file field named "file"
- File must be an image (content type starts with "image/")
- File size must not exceed 10MB

**Post-conditions:**
- On success: Returns generated HTML/CSS code
- On failure: Returns appropriate error message and status code

**Exceptions Thrown:**
- Generic `Exception`: Caught and returns 500 error response with message "Generation failed."

---

## Collaboration Server Module (`CollabServer.py`)

### Metaclasses

#### `SingletonMeta`

**Purpose:** Metaclass that implements the Singleton design pattern, ensuring only one instance of a class exists.

**Data Fields:**
- `_instance` (class variable): Stores the single instance of the class (initially None)

**Methods:**

##### `__call__(cls, *args, **kwargs)`

**Purpose:** Controls instance creation to ensure singleton behavior.

**Parameters:**
- `cls` (type): The class being instantiated
- `*args`: Variable positional arguments
- `**kwargs`: Variable keyword arguments

**Return Value:**
- Instance of the class (either existing or newly created)

**Pre-conditions:** None

**Post-conditions:** 
- Returns the existing instance if one exists
- Creates and returns a new instance if none exists

**Exceptions Thrown:** None

---

### Classes

#### `CollabServer`

**Purpose:** Singleton server class that manages real-time collaboration by handling scene updates, page updates, and user connections for shared sketches.

**Metaclass:** `SingletonMeta` (ensures only one instance exists)

**Data Fields:** None (uses singleton pattern, no instance-specific fields defined)

**Methods:**

##### `sendSceneUpdate(userID, sketchID, sketchData)`

**Purpose:** Sends a scene update message to a specific user via Django Channels, notifying them of changes to sketch data.

**Parameters:**
- `userID` (str): Unique identifier for the target user
- `sketchID` (str): Unique identifier for the sketch being updated
- `sketchData` (dict/object): The updated sketch scene data

**Return Value:** None

**Pre-conditions:**
- Django Channels must be properly configured
- User channel must exist for the given userID
- `async_to_sync` must be imported (currently missing from imports)

**Post-conditions:**
- Message of type "scene.update" is sent to the user's channel

**Exceptions Thrown:**
- `NameError`: `async_to_sync` is not imported
- Channel layer exceptions if user channel doesn't exist

---

##### `sendPageUpdate(userID, sketchID, name)`

**Purpose:** Sends a page update message to a specific user, notifying them of changes to a page/sketch name.

**Parameters:**
- `userID` (str): Unique identifier for the target user
- `sketchID` (str): Unique identifier for the sketch
- `name` (str): The new/updated name for the page

**Return Value:** None

**Pre-conditions:**
- Django Channels must be properly configured
- User channel must exist for the given userID
- `async_to_sync` must be imported (currently missing from imports)

**Post-conditions:**
- Message of type "page.update" is sent to the user's channel

**Exceptions Thrown:**
- `NameError`: `async_to_sync` is not imported
- Channel layer exceptions if user channel doesn't exist

---

##### `onNewConnection(userID, collabID)`

**Purpose:** Handler method to be implemented for processing new user connections to a collaboration session. (Placeholder - implementation pending in STS-26)

**Parameters:**
- `userID` (str): Unique identifier for the connecting user
- `collabID` (str): Unique identifier for the collaboration session

**Return Value:** None (currently pass statement)

**Pre-conditions:** None defined

**Post-conditions:** None (no implementation yet)

**Exceptions Thrown:** None

---

##### `onSceneUpdate(userID, collabID, sketchID, sketchData)`

**Purpose:** Handler method to be implemented for processing scene update events from users. (Placeholder - implementation pending in STS-26)

**Parameters:**
- `userID` (str): Unique identifier for the user making the update
- `collabID` (str): Unique identifier for the collaboration session
- `sketchID` (str): Unique identifier for the sketch being updated
- `sketchData` (dict/object): The updated sketch scene data

**Return Value:** None (currently pass statement)

**Pre-conditions:** None defined

**Post-conditions:** None (no implementation yet)

**Exceptions Thrown:** None

---

##### `onPageUpdate(userID, collabID, sketchID, name)`

**Purpose:** Handler method to be implemented for processing page/sketch name update events. (Placeholder - implementation pending in STS-26)

**Parameters:**
- `userID` (str): Unique identifier for the user making the update
- `collabID` (str): Unique identifier for the collaboration session
- `sketchID` (str): Unique identifier for the sketch
- `name` (str): The new name for the page

**Return Value:** None (currently pass statement)

**Pre-conditions:** None defined

**Post-conditions:** None (no implementation yet)

**Exceptions Thrown:** None

---

##### `onConnectionEnd(userID)`

**Purpose:** Handler method to be implemented for processing user disconnection events. (Placeholder - implementation pending in STS-26)

**Parameters:**
- `userID` (str): Unique identifier for the disconnecting user

**Return Value:** None (currently pass statement)

**Pre-conditions:** None defined

**Post-conditions:** None (no implementation yet)

**Exceptions Thrown:** None

---

## Claude Client Service Module (`claudeClient.py`)

### Functions

#### `_load_anthropic_key_from_file()`

**Purpose:** Internal helper function that reads the Anthropic API key from a plaintext file specified in Django settings.

**Parameters:** None

**Return Value:**
- `str`: The API key string (whitespace trimmed)

**Pre-conditions:**
- `CLAUDE_API_KEY` setting must be defined in Django settings
- The file path specified in settings must exist and be readable
- The file must contain a non-empty API key

**Post-conditions:** Returns the API key as a string

**Exceptions Thrown:**
- `RuntimeError`: If `CLAUDE_API_KEY` is not configured in settings
- `RuntimeError`: If the API key file is empty
- `FileNotFoundError`: If the specified file path doesn't exist
- `PermissionError`: If the file cannot be read due to permissions

---

#### `_client()`

**Purpose:** Internal helper function that creates and returns an authenticated Anthropic client instance.

**Parameters:** None

**Return Value:**
- `Anthropic`: Authenticated Anthropic API client instance

**Pre-conditions:**
- API key must be available via `_load_anthropic_key_from_file()`

**Post-conditions:** Returns configured Anthropic client

**Exceptions Thrown:**
- `RuntimeError`: Propagated from `_load_anthropic_key_from_file()` if API key is not configured
- `FileNotFoundError`: Propagated if API key file doesn't exist

---

#### `_extract_text(resp)`

**Purpose:** Internal helper function that extracts and concatenates all text blocks from a Claude API response object.

**Parameters:**
- `resp` (Message): Anthropic API response object containing content blocks

**Return Value:**
- `str`: Concatenated text from all text-type content blocks (whitespace trimmed)

**Pre-conditions:**
- Response object must have a `content` attribute (list of content blocks)

**Post-conditions:** Returns extracted text string (may be empty if no text blocks found)

**Exceptions Thrown:** None (handles missing attributes gracefully)

---

#### `image_to_html_css(image_bytes, media_type, prompt)`

**Purpose:** Main service function that sends an image (with optional text prompt) to Claude AI and receives generated HTML/CSS code that recreates the UI design from the image.

**Parameters:**
- `image_bytes` (bytes): Raw binary data of the image file
- `media_type` (str, optional): MIME type of the image (default: "image/png")
- `prompt` (Optional[str], optional): Custom user instruction for code generation (default: None)

**Return Value:**
- `str`: Generated HTML and CSS code as a string

**Pre-conditions:**
- Valid image bytes must be provided
- Anthropic API key must be configured
- `CLAUDE_MODEL` setting should be defined in Django settings (defaults to "claude-sonnet-4-20250514")

**Post-conditions:**
- Returns production-ready HTML/CSS code
- Image is base64 encoded before sending to API

**System Prompt Context:**
- Instructs Claude to be a frontend assistant
- Requests high-fidelity, production-ready HTML and CSS
- Specifies semantic HTML, minimal wrappers, inline styles
- Allows Bootstrap or Tailwind CSS
- Prohibits body tags and markdown fences

**Default User Instruction:**
- Generate HTML/CSS recreating the layout
- Use labeled HTML tags from the image
- Include text content from the image
- Use placeholders for icons/images
- Provide only code without markdown fences

**Exceptions Thrown:**
- `RuntimeError`: If Claude returns no text content
- `RuntimeError`: Propagated if API key is not configured
- `FileNotFoundError`: Propagated if API key file doesn't exist
- API exceptions from Anthropic SDK (network errors, rate limits, etc.)

---

### Configuration Constants

#### `MAX_BYTES`
- **Module:** `views.py`
- **Value:** 10485760 (10MB)
- **Purpose:** Maximum allowed file size for image uploads
- **Type:** `int`

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/test/` | Any | Test backend connectivity | None (CSRF exempt) |
| `/api/generate-mockup/` | POST | Placeholder for mockup generation | None (CSRF exempt) |
| `/api/generate/` | POST | Generate HTML/CSS from image | None (CSRF exempt) |
| `/` (frontend) | GET | Serve frontend application | Standard |

---