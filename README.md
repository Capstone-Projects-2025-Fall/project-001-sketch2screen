<div align="center">

# From Sketch To Screen
[![Report Issue on Jira](https://img.shields.io/badge/Report%20Issues-Jira-0052CC?style=flat&logo=jira-software)](https://temple-cis-projects-in-cs.atlassian.net/jira/software/c/projects/DT/issues)
[![Deploy Docs](https://github.com/ApplebaumIan/tu-cis-4398-docs-template/actions/workflows/deploy.yml/badge.svg)](https://github.com/ApplebaumIan/tu-cis-4398-docs-template/actions/workflows/deploy.yml)
[![Documentation Website Link](https://img.shields.io/badge/-Documentation%20Website-brightgreen)](https://applebaumian.github.io/tu-cis-4398-docs-template/)


</div>


## Keywords

CIS 4398, Web Application, React, Python/Django, AI/ML, Real-time Collaboration, UI/UX Design, Sketch-to-Code, WebSocket, Large Language Models

## Project Abstract

Sketch2Screen is an AI-powered collaborative web application that transforms hand-drawn sketches into functional UI components and production-ready code. The application enables individuals, including those without programming expertise, to convert their design ideas into working website components through simple sketches. Users can collaborate in real-time, sketching interface elements that the system converts into structured UI components with the assistance of a Large Language Model (LLM). These components can then be refined, arranged into complete layouts, and exported as code in multiple frameworks (HTML/CSS, React, Vue, etc.). The primary purpose of the application is to empower non-programmers to create websites using their imagination and minimal coding knowledge, thereby lowering the barrier to entry for web development.

## High Level Requirement

Sketch2Screen provides a collaborative canvas where users can sketch UI components using built-in drawing tools. Once sketches are complete, users trigger AI-powered generation to convert drawings into professional design mockups with corresponding code. The system provides multiple design variations for each component, allowing users to select their preferred options. Selected components are transferred to a design mode where users can arrange layouts, adjust positioning, and refine the overall page structure. The final output can be exported as production-ready code in various frameworks. Real-time collaboration enables multiple users to work simultaneously on the same workspace, with all changes synchronized instantly across connected clients.

## Conceptual Design

The application follows a client-server architecture with real-time collaboration capabilities:

- **Frontend**: React-based web application providing an interactive canvas for sketching and design manipulation
- **Backend**: Python/Django server handling API requests, workspace management, and WebSocket connections for real-time updates
- **AI Integration**: Large Language Model API integration for sketch-to-component conversion and code generation
- **Database**: Storage system for workspace persistence, user sketches, and generated components
- **Real-time Communication**: WebSocket protocol for live collaboration between multiple users

The system processes user sketches through an AI model that analyzes drawings and generates multiple UI component variations. Users interact through a browser-based interface with no installation required, making it accessible across different platforms and devices.

## Background

Several existing industry tools enable users to create designs without code:

Online graphic design tools like **Canva** allow users to create designs by manipulating shapes, colors, and text. While these applications improve efficiency and facilitate brainstorming, their outputs are generally limited to static images that still require manual coding to embed into a website. These platforms do not leverage AI for sketch-to-design conversion.

**Figma** is a widely-used collaborative design tool with extensive functionality and supports plugins for exporting designs into CSS code. While Figma has introduced AI-assisted features for simplifying tasks, it does not directly transform hand-drawn sketches into functional UI components.

Sketch2Screen fills this gap by combining the collaborative design strengths of tools like Figma with AI-powered sketch recognition and multi-framework code generation. This approach simplifies design creation, reduces technical barriers, and enables a broader audience—including non-programmers—to bring their ideas to life efficiently.

## Required Resources

**Development Resources:**
- Modern web browsers (Chrome, Firefox, Safari, Edge) for testing
- React development environment and related libraries
- Python/Django backend framework
- WebSocket library for real-time communication
- Access to Large Language Model API (OpenAI GPT, Claude, or similar)
- Version control system (Git/GitHub)

**Knowledge Requirements:**
- Frontend development: React, JavaScript/TypeScript, HTML5 Canvas API
- Backend development: Python, Django, RESTful API design
- Real-time communication: WebSocket protocols
- AI/ML integration: API integration, prompt engineering
- Database design and management

**Hardware/Infrastructure:**
- Development machines for team members
- Cloud hosting platform for deployment (AWS, Heroku, or similar)
- Database hosting service

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 22.x LTS or later (minimum: 22.12+)
- npm

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen
   cd project-001-sketch2screen
   ```

2. **Set up Python virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configure Anthropic API Keys**

   The application requires **two** Anthropic API keys for different features:

   Create two files in the project root:
   ```bash
   echo "your-main-api-key-here" > APIkey.txt      # For sketch-to-HTML generation
   echo "your-variation-api-key-here" > APIkey2.txt # For component variations
   ```

   **Or** set as environment variables:
   ```bash
   export ANTHROPIC_API_KEY="your-main-api-key-here"
   export ANTHROPIC_VARIATIONS_API_KEY="your-variation-api-key-here"
   ```

   > **Note:** You can use the same API key for both files if you don't need separate keys for cost management.

### Running the Application

Terminal 1 - Backend:
```bash
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
python manage.py runserver
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Then open http://localhost:8000 in your browser.

### Running Docusaurus Site

```bash
cd documentation
yarn install
yarn start
```

## Collaborators

<div align="center">

[//]: # (Replace with your collaborators)
[Seunghun Lee](https://github.com/edicyl) • [Wenhao Yang](https://github.com/Iderad) • [ChungYing Lee](https://github.com/e22440228) • [Sahil Jartare](https://github.com/Sahil-Jartare) • [Nick Rehac](https://github.com/nickrehac)

</div>
