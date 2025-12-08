---
sidebar_position: 1
---
# Unit Tests

## Frontend

All frontend testing will be done with **vitest**.
Vitest was chosen as it is designed to work with our chosen dev framework, vite.

Due to the nature of react, only non-react functions, such as helper functions, will be subject to unit tests.
Components will be tested through integration tests instead.

### App

| Function                 | Goal                                                 |
| ------------------------ | ---------------------------------------------------- |
| makeEmptyScene()         | returns a valid, empty SceneData object              |
| makeNewSketchPage(index) | returns valid SketchPage object with the given index |

### Collector


| Function          | Goal                                                         |
| ----------------- | ------------------------------------------------------------ |
| Collector(string) | given a sample html string, returns array of parsed elements |

## Backend

All backend testing will be done with **Pytest**. Mock django objects will be used for anything not being directly tested.

### Testing Procedure
From **ROOT** folder  
```DIGITAL Command Language
cd backend/sketch_api
pytest
``` 

### Mockup Generation API:

| Goal                   | Input              | Output                |
| ---------------------- | ------------------ | --------------------- |
| POST returns success   | Blank POST request | Success response      |
| POST returns mockup id | Blank POST request | Mockup ID of response |
| GET returns error      | Blank GET request  | HTTP 405              |
| PUT returns error      | Blank PUT request  | HTTP 405              |

### Frontend View:

| Goal                         | Input   | Output                                         |
| ---------------------------- | ------- | ---------------------------------------------- |
| Renders appropriate template | GET "/" | registered render of "frontend/src/index.html" |
| Accepts GET requests         | GET "/" | registered access of render function           |
| Returns result from render   | GET "/" | response matching preset test response         |

### Generate View:

| Goal                           | Input                             | Output                                   |
| ------------------------------ | --------------------------------- | ---------------------------------------- |
| Error on missing file          | POST with no file                 | HTTP 400                                 |
| Error on massive file          | POST with file > 10MB             | HTTP 413                                 |
| Error on incorrect file type   | POST with text file               | HTTP 400                                 |
| Successful generation          | POST with PNG                     | HTTP 200 + generated html in response    |
| Prompt parameter processed     | POST with PNG and prompt          | Mock LLM API registers additional prompt |
| File conversion errors handled | POST with PNG and simulated error | HTTP 500                                 |
| Accepts different file types   | POST with JPG                     | HTTP 200                                 |

