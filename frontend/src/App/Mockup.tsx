// Mockup.tsx
//This is just for safety purposes. You can remove it if you want. It just detects unsafe HTML code.
import DOMPurify from "dompurify";
import styles from "./App.module.css";
import {useState} from "react";
import PageSidebar from "./reusable_sidebar";
import type { Mock } from "node:test";


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
};


/**
 * Display generated HTML/CSS mockups with a sidebar for navigation
 * @param props - Component properties
 * @param props.mockups - Array of generated mockups to display
 */

export default function Mockup ({ mockups = [] }: Props){
  /** Sidebar expanded or not */
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  /** ID of currently displayed mockup */
  const [activeMockupId, setActiveMockupId] = useState<string | null>(
    mockups.length > 0 ? mockups[0].id : null
  );

  /** Currently active mockup */
  const activeMockup = mockups.find((m) => m.id === activeMockupId);

  /** Sanitized HTML for display */
  const safeHtml = activeMockup ? DOMPurify.sanitize(activeMockup.html) : "";

  /**Message if no mockups */
  if (mockups.length === 0) {
    return (
      <div className={styles.mockup}>
        <em>No mockup yet. Click "Generate" to create mockups from your sketches.</em>
      </div>
    );
  }


  return (
    <div className = {styles.mockupContainer}>
        <PageSidebar<MockupPage>
          title="Generated Pages"
          items={mockups}
          activeItemId={activeMockupId || mockups[0].id}
          onSelectItem={setActiveMockupId}
          editingId={null}
          onSetEditingId={() => {}} // No editing in mockup view
          expanded={sidebarExpanded}
          onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
          showActions={false} // No add/duplicate in mockup view
          allowDelete={false} // No delete in mockup view
        />

        <div className={styles.mockup}>
          {activeMockup && (
            <iframe
              srcDoc={safeHtml}
              className={styles.preview}
              title={`Mockup preview: ${activeMockup.name}`}
            />
          )}
        </div>
    </div>
    );
}