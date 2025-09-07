---
sidebar_position: 1
---

# System Overview

## Project Abstract

This document proposes an AI-powered collaborative web application that converts user sketches into UI components which can then be exported as code. The application enables individuals, including those without programming expertise, to transform their ideas into functional website components through simple sketches.

Users can collaborate in real time, sketching interface elements that the system repurposes and converts into structured UI components with the assistance of a Large Language Model (LLM). These components can then be refined and exported as production-ready code. The primary purpose of the application is to empower non-programmers to create websites using their imagination and minimal coding knowledge, thereby lowering the barrier to entry for web development.

##Conceptual Design

The frontend of the application will feature a collaborative blank canvas where individual users or teams can sketch interface elements using built-in drawing tools. Once the sketches are complete, the user can select “Generate,” prompting the AI model to convert the drawings into design mockups along with the corresponding CSS and code.

The system will provide multiple design options for each sketched component. Users can select their preferred option, replace individual elements, or regenerate designs for further refinement. The updated designs will be rendered on a shared canvas, enabling users to adjust layout, reposition components, and link elements to create interactive flows (e.g., linking a button to a webpage).

This workflow allows teams to rapidly prototype and iterate on designs, increasing efficiency and fostering collaboration. By bridging sketches with AI-driven code generation, the application significantly reduces the effort required to translate ideas into tangible, functional interfaces.

##Background

Several existing industry tools—such as FigJam, Canva, and ConceptBoard—enable users to create no-code designs by manipulating shapes, colors, and text. While these applications improve efficiency and facilitate brainstorming, their outputs are generally limited to static images, which still require manual coding to embed into a website. Additionally, these platforms do not leverage AI for sketch-to-design conversion, making the design process more labor-intensive.

Another widely used tool, Figma, allows collaborative design with extensive functionality and supports plugins for exporting designs into CSS code. While Figma has introduced AI-assisted features for simplifying tasks, it does not directly transform hand-drawn sketches into functional UI components.

The proposed application fills this gap by combining the collaborative design strengths of tools like Figma with AI-powered sketch recognition and code generation. This approach simplifies design creation, reduces technical barriers, and enables a broader audience, including non-programmers to bring their ideas to life efficiently.

