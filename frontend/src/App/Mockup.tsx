// Mockup.tsx
//This is just for safety purposes. You can remove it if you want. It just detects unsafe HTML code.
import DOMPurify from "dompurify";
import styles from "./App.module.css";
import {useState, useRef} from "react";
import PageSidebar from "./reusable_sidebar";
import type { Mock } from "node:test";
import { OutputPage } from "./setting/OutputPage";

export type MockupPage = {
  /** Unique identifier */
  id: string;
  /** Name of sketch page */
  name: string; 
  /** HTML content of the mockup */
  html: string;
}

/** Props for the Mockup component */
type Props = {
  /** The HTML string returned by the backend (Claude) */
 mockups?: MockupPage[];
 activePageId: string | null;
 onSelectPage: (id : string) => void;
 
};


/**
 * Display generated HTML/CSS mockups with a sidebar for navigation
 * @param props - Component properties
 * @param props.mockups - Array of generated mockups to display
 */

export default function Mockup ({ mockups = [], activePageId, onSelectPage }: Props){
  /** Sidebar expanded or not */
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /** Currently active mockup */
  const activeMockup = mockups.find((m) => m.id === activePageId);

  /** Sanitized HTML for display */
   const safeHtml = activeMockup ? DOMPurify.sanitize(activeMockup.html, {
    WHOLE_DOCUMENT: true,
    FORCE_BODY: false,
    ADD_TAGS: ['link','script'],
    ADD_ATTR: ['target']
  }) : "";
  
  /**Message if no mockups */
  if (mockups.length === 0) {
    return (
      <div className={styles.mockup}>
        <em>No mockup yet. Draw your sketch and press "Generate".</em>
      </div>
    );
  }


  return (
    <div className = {styles.mockupContainer}>
        <PageSidebar<MockupPage>
          title="Generated Pages"
          items={mockups}
          activeItemId={activePageId || mockups[0].id}
          onSelectItem={onSelectPage || (() => {})}
          editingId={null}
          onSetEditingId={() => {}} // No editing in mockup view
          expanded={sidebarExpanded}
          onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
          showActions={false} // No add/duplicate in mockup view
          allowDelete={false} // No delete in mockup view
        />

        <div className={styles.mockup}>
          {activeMockup && (
            <div className={styles.previewContainer}>
              <iframe
                srcDoc={OutputPage(safeHtml)}
                className={styles.preview}
                title={`Mockup preview: ${activeMockup.name}`}
                sandbox="allow-same-origin allow-scripts allow-forms"
                referrerPolicy="same-origin"
                ref={iframeRef}
              />
            </div>
          )}
        </div>
    </div>
    );
}