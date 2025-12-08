/**
 * Entry point for the React application
 * @module main
 */

(window as any).EXCALIDRAW_ASSET_PATH = "/static/excalidraw-assets/";

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

/** Main application component */
import App from "./App/App.tsx"

/**
 * Renders the application into the DOM
 * @remarks
 * - Uses React 18 createRoot API
 * - Wraps App in StrictMode for development checks
 * - Mounts at element with id 'root'
 */
createRoot(document.getElementById('root')!).render(
//i swear this is necessary i hate excalidraw
//same i hate it too
//  <StrictMode>
    <App/>
//  </StrictMode>,
)
