// Mockup.tsx
//This is just for safety purposes. You can remove it if you want. It just detects unsafe HTML code.
import DOMPurify from "dompurify";
import styles from "./App.module.css";
import {useState, useRef, forwardRef, useImperativeHandle} from "react";
import PageSidebar from "./reusable_sidebar";
import type { Mock } from "node:test";
import { OutputPage } from "./setting/OutputPage";
import { useEffect } from 'react';
import VariationSidebar from "./DesignStyleChangeUsingAI/components/VariationSidebar";
import SettingsPanel from "./sidebar/SettingsPanel";

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

export interface MockupHandle {
  getIframeRef: () => React.MutableRefObject<HTMLIFrameElement | null>;
}

/**
 * Display generated HTML/CSS mockups with a sidebar for navigation
 * @param props - Component properties
 * @param props.mockups - Array of generated mockups to display
 */

const Mockup = forwardRef<MockupHandle, Props>(({ mockups = [], activePageId, onSelectPage }: Props, ref) => {
  /** Sidebar expanded or not */
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  //State for active tab
  const [activeTab, setActiveTab] = useState<'pages' | 'settings' | 'variations'>('pages');
  // Variation sidebar state
  const [selectedElement, setSelectedElement] = useState<{
    id: string;
    html: string;
    type: string;
  } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Expose iframe ref to parent component
  useImperativeHandle(ref, () => ({
    getIframeRef: () => iframeRef,
  }), []);

  /** Currently active mockup */
  const activeMockup = mockups.find((m) => m.id === activePageId);


  /** Clean HTML */
  // Clean markdown fences from mockup HTML
  const cleanedHtml = activeMockup 
  ? activeMockup.html
      .replace(/```html\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim()
  : "";

  /** Sanitized HTML for display */
   const safeHtml = cleanedHtml ? DOMPurify.sanitize(cleanedHtml, {
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
  /**  Listen for element selection messages from iframe*/
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_SELECTED') {
        setSelectedElement({
          id: event.data.elementId,
          html: event.data.elementHtml,
          type: event.data.elementType,
        });
        
        // Auto-switch to Settings tab only if currently on Pages tab
        if (activeTab === 'pages') {
          setActiveTab('settings');
        }
      } else if (event.data.type === 'APPLY_VARIATION') {
        // Variation was applied - could add success notification here
        console.log('Variation applied:', event.data.elementId);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTab]);

  // Reset to Pages tab when switching mockup pages
    useEffect(() => {
      setActiveTab('pages');
    }, [activePageId]);
    
  // Handle applying a variation
  const handleApplyVariation = (newHtml: string) => {
    console.log('🔵 Mockup: Applying variation', {
        elementId: selectedElement?.id,
        newHtml: newHtml.substring(0, 30),
        iframeExists: !!iframeRef.current,
        iframeContentWindow: !!iframeRef.current?.contentWindow
      });

    if (!iframeRef.current || !selectedElement){
          console.error('❌ Cannot apply: iframe or selectedElement missing');
          return;
    }

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
    <div className={styles.mockupContainer}>
      {/* Tabbed Sidebar */}
      <>
        <button
          className={styles.sidebarToggle}
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          style={{ left: sidebarExpanded ? '260px' : '0px' }}
        >
          {sidebarExpanded ? '«' : '»'}
        </button>

        <aside className={`${styles.sidebar} ${!sidebarExpanded ? styles.sidebarCollapsed : ""}`}>
          {/* Tab Bar */}
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${activeTab === 'pages' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('pages')}
            >
              Pages
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'variations' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('variations')}
            >
              Variations
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {/* Pages Tab */}
            {activeTab === 'pages' && (
              <div className={styles.pageList}>
                {mockups.map((mockup) => (
                  <div
                    key={mockup.id}
                    className={`${styles.pageItem} ${mockup.id === activePageId ? styles.pageItemSelected : ''}`}
                    onClick={() => onSelectPage(mockup.id)}
                    title={mockup.name}
                  >
                    <div className={styles.pageItemLabel}>
                      <span className={styles.pageIcon} aria-hidden />
                      <span className={styles.pageNameText}>{mockup.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <SettingsPanel 
                selectedElement={selectedElement} 
                iframeRef={iframeRef}
              />
            )}

            {/* Variations Tab */}
            {activeTab === 'variations' && (
              <div className={styles.variationsTabWrapper}>
                {!selectedElement ? (
                  <div className={styles.emptyState}>
                    <p>Select an element to see design variations</p>
                  </div>
                ) : (
                  <VariationSidebar
                    elementId={selectedElement.id}
                    elementHtml={selectedElement.html}
                    elementType={selectedElement.type}
                    onApplyVariation={handleApplyVariation}
                    onClose={() => setSelectedElement(null)}
                  />
                )}
              </div>
            )}
          </div>
        </aside>
      </>

      {/* Mockup Preview */}
      <div className={styles.mockup}>
        {mockups.length === 0 ? (
          <em>No mockup yet. Draw your sketch and press "Generate".</em>
        ) : (
          activeMockup && (
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
          )
        )}
      </div>
    </div>
    );
});

Mockup.displayName = 'Mockup';
export default Mockup;