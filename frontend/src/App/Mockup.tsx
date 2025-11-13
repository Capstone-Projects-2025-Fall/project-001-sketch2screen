// Mockup.tsx
//This is just for safety purposes. You can remove it if you want. It just detects unsafe HTML code.
import DOMPurify from "dompurify";
import styles from "./App.module.css";
import {useState, useRef} from "react";
import PageSidebar from "./reusable_sidebar";
import type { Mock } from "node:test";
import { OutputPage } from "./setting/OutputPage";
import { useEffect } from 'react';
import VariationSidebar from "./DesignStyleChangeUsingAI/components/VariationSidebar";

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
  // Variation sidebar state
  const [selectedElement, setSelectedElement] = useState<{
    id: string;
    html: string;
    type: string;
  } | null>(null);

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

  /**  Listen for element selection messages from iframe*/
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_SELECTED') {
        setSelectedElement({
          id: event.data.elementId,
          html: event.data.elementHtml,
          type: event.data.elementType,
        });
      } else if (event.data.type === 'APPLY_VARIATION') {
        // Variation was applied - could add success notification here
        console.log('Variation applied:', event.data.elementId);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle applying a variation
  const handleApplyVariation = (newHtml: string) => {
    if (!iframeRef.current || !selectedElement) return;
    
    // Send message to iframe to update the element
    iframeRef.current.contentWindow?.postMessage({
      type: 'APPLY_VARIATION',
      elementId: selectedElement.id,
      newHtml: newHtml,
    }, '*');
  };

   // Close variation sidebar
  const handleCloseSidebar = () => {
    setSelectedElement(null);
  };


  return (
    <div className = {selectedElement ? styles.mockupContainerWithVariations : styles.mockupContainer}>
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
        {/* Variation sidebar */}
        {selectedElement && (
          <VariationSidebar
            elementId={selectedElement.id}
            elementHtml={selectedElement.html}
            elementType={selectedElement.type}
            onApplyVariation={handleApplyVariation}
            onClose={handleCloseSidebar}
          />
        )}
    </div>
    );
}