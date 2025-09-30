---
sidebar_position: 4
---

# Development Environment

## Software & Frameworks

### IDE
* Visual Studio Code

### Package Managers
* npm (Frontend)
* pip (Backend)

### Programming Languages & Core Libraries

#### Frontend
* TypeScript
* React & ReactDOM
* react-konva (Canvas drawing)
* Excalidraw (Collaborative drawing)
* Tailwind CSS

#### Backend
* Python
* Django
* Django REST Framework
* Anthropic Claude API

### Build Tool
* Vite (Frontend)

### Database
* Development - SQLite
* Production - (planned)

### Version Control
* Git
* GitHub

### Documentation
* Docusaurus
* Markdown

### Testing
* Browser (Chromium, Firefox, Safari)
* Django Test Framework
* Postman (API testing)

---

## Setup Tasks

| ID | Task | Status |
|----|------|--------|
| S2S-1 | Install Git | Done |
| S2S-2 | Install Visual Studio Code | Done |
| S2S-3 | Install Node.js & npm | Done |
| S2S-4 | Install Python 3.11+ | Done |
| S2S-5 | Clone repository | Done |
| S2S-6 | Install frontend dependencies | Done |
| S2S-7 | Install backend dependencies | Done |
| S2S-8 | Configure environment variables | Done |
| S2S-9 | Verify development servers | Done |
| S2S-10 | Setup documentation site | Done |

---

## Development Workflow

### Starting Development Servers

**Frontend**
```bash
cd frontend
npm run dev
```
Runs on `http://localhost:5173`

**Backend**
```bash
cd backend
python manage.py runserver
```
Runs on `http://localhost:8000`

**Documentation**
```bash
cd documentation
yarn start
```
Runs on `http://localhost:3000`
