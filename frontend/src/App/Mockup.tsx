// Mockup.tsx
//This is just for safety purposes. You can remove it if you want. It just detects unsafe HTML code.
import DOMPurify from "dompurify";
import styles from "./App.module.css";
import {useState, useRef, forwardRef, useImperativeHandle, useCallback} from "react";
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
 mockupStyles: {
    [mockupPageId: string]: {
      [elementId: string]: {
        current: {
          styles: { [property: string]: string };
          html: string | null;
          attributes?: { [attribute: string]: string };
        };
        history: Array<{
          styles: { [property: string]: string };
          html: string | null;
          attributes?: { [attribute: string]: string };
        }>;
        future: Array<{
          styles: { [property: string]: string };
          html: string | null;
          attributes?: { [attribute: string]: string };
        }>;
      };
    };
  };
  setMockupStyles: React.Dispatch<React.SetStateAction<{
    [mockupPageId: string]: {
      [elementId: string]: {
        current: {
          styles: { [property: string]: string };
          html: string | null;
          attributes?: { [attribute: string]: string };
        };
        history: Array<{
          styles: { [property: string]: string };
          html: string | null;
          attributes?: { [attribute: string]: string };
        }>;
        future: Array<{
          styles: { [property: string]: string };
          html: string | null;
          attributes?: { [attribute: string]: string };
        }>;
      };
    };
  }>>;
  /** Page links: maps elementId to target page ID per mockup page */
  pageLinks: {
    [mockupPageId: string]: {
      [elementId: string]: string;
    };
  };
  setPageLinks: React.Dispatch<React.SetStateAction<{
    [mockupPageId: string]: {
      [elementId: string]: string;
    };
  }>>;
};

export interface MockupHandle {
  getIframeRef: () => React.MutableRefObject<HTMLIFrameElement | null>;
}

/**
 * Display generated HTML/CSS mockups with a sidebar for navigation
 * @param props - Component properties
 * @param props.mockups - Array of generated mockups to display
 */

const Mockup = forwardRef<MockupHandle, Props>(({ mockups = [], activePageId, onSelectPage, mockupStyles, setMockupStyles, pageLinks, setPageLinks }: Props, ref) => {
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
  
  // Initialize element in history if it does not exist
  // MUST be defined before useEffects that use it
  const initializeElementHistory = useCallback((elementId: string) => {
    if (!activePageId) return;

    setMockupStyles(prev => {
      if (prev[activePageId]?.[elementId]) return prev; // Already exists

      return {
        ...prev,
        [activePageId]: {
          ...prev[activePageId],
          [elementId]: {
            current: { styles: {}, html: null },
            history: [],
            future: [],
          },
        },
      };
    });
  }, [activePageId, setMockupStyles]);

  // Handle element selection messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_SELECTED') {
        setSelectedElement({
          id: event.data.elementId,
          html: event.data.elementHtml,
          type: event.data.elementType,
        });

        initializeElementHistory(event.data.elementId);

        if (activeTab === 'pages') {
          setActiveTab('settings');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTab, activePageId, initializeElementHistory]);

  // Reset to Pages tab when page changes
  useEffect(() => {
    setActiveTab('pages');
  }, [activePageId]);

  /** Keyboard Listener for Ctrl+Z and Ctrl+Y */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElement || activeTab === 'pages') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, activeTab, activePageId, mockupStyles]);

  // Listen for iframe loaded and inject saved styles and page links
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'IFRAME_LOADED' && activePageId) {
        const pageStylesForPage = mockupStyles[activePageId];

        if (pageStylesForPage) {
          Object.entries(pageStylesForPage).forEach(([elementId, data]) => {
            applyStateToIframe(elementId, data.current);
          });
        }

        const pageLinksForPage = pageLinks[activePageId];
        if (pageLinksForPage && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'INJECT_PAGE_LINKS',
            links: pageLinksForPage,
          }, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activePageId, mockupStyles, pageLinks]);

  /**Message if no mockups */
  if (mockups.length === 0) {
    return (
      <div className={styles.mockup}>
        <em>No mockup yet. Draw your sketch and press "Generate".</em>
      </div>
    );
  }

  // Handle applying a variation
  const handleApplyVariation = (newHtml: string) => {
    if (!iframeRef.current || !selectedElement) return;
    handleApplyVariationWithHistory(newHtml);
  };

  const handleCloseSidebar = () => {
    setSelectedElement(null);
  };

  // Push current state to history and update with new state
  const pushToHistory = (elementId: string, newStyles: { [property: string]: string }, newHtml: string | null) => {
    if (!activePageId) return;
    
    setMockupStyles(prev => {
      const pageStyles = prev[activePageId] || {};
      const elementData = pageStyles[elementId] || {
        current: { styles: {}, html: null },
        history: [],
        future: [],
      };
      
      // Push current to history
      const newHistory = [...elementData.history, elementData.current];
      
      // Limit history to 50 items
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      return {
        ...prev,
        [activePageId]: {
          ...pageStyles,
          [elementId]: {
            current: { styles: newStyles, html: newHtml },
            history: newHistory,
            future: [], // Clear future on new change
          },
        },
      };
    });
  };

  // Handle style change from Settings panel
  const handleStyleChangeWithHistory = (elementId: string, property: string, value: string) => {
    if (!activePageId) return;

    // Get current state
    const currentData = mockupStyles[activePageId]?.[elementId]?.current || {
      styles: {},
      html: null,
      attributes: {},
    };

    // Create new styles object
    const newStyles = { ...currentData.styles, [property]: value };

    // Push to history and update
    pushToHistory(elementId, newStyles, currentData.html);

    // Send to iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_ELEMENT_STYLE',
        elementId,
        property,
        value,
      }, '*');
    }
  };

  // Handle attribute change from Settings panel (e.g., image src)
  const handleAttributeChange = (elementId: string, attribute: string, value: string) => {
    if (!activePageId) return;

    // Store attribute in mockupStyles
    setMockupStyles(prev => {
      const pageStyles = prev[activePageId] || {};
      const elementData = pageStyles[elementId] || {
        current: { styles: {}, html: null, attributes: {} },
        history: [],
        future: [],
      };

      return {
        ...prev,
        [activePageId]: {
          ...pageStyles,
          [elementId]: {
            ...elementData,
            current: {
              ...elementData.current,
              attributes: {
                ...elementData.current.attributes,
                [attribute]: value,
              },
            },
          },
        },
      };
    });

    // Send to iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_ELEMENT_ATTRIBUTE',
        elementId,
        attribute,
        value,
      }, '*');
    }
  };

  // Handle variation application with history
  const handleApplyVariationWithHistory = (newHtml: string) => {
    if (!selectedElement || !activePageId) return;

    pushToHistory(selectedElement.id, {}, newHtml);

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'APPLY_VARIATION',
        elementId: selectedElement.id,
        newHtml: newHtml,
      }, '*');
    }
  };

  // Undo function
  const handleUndo = () => {
    if (!selectedElement || !activePageId) return;
    
    const elementData = mockupStyles[activePageId]?.[selectedElement.id];
    if (!elementData || elementData.history.length === 0) return;
    
    setMockupStyles(prev => {
      const pageStyles = prev[activePageId];
      const element = pageStyles[selectedElement.id];
      
      // Pop from history
      const newHistory = [...element.history];
      const previousState = newHistory.pop()!;
      
      // Push current to future
      const newFuture = [element.current, ...element.future];
      
      return {
        ...prev,
        [activePageId]: {
          ...pageStyles,
          [selectedElement.id]: {
            current: previousState,
            history: newHistory,
            future: newFuture,
          },
        },
      };
    });
    
    // Apply the previous state to iframe
    const previousState = elementData.history[elementData.history.length - 1];
    applyStateToIframe(selectedElement.id, previousState);
  };

  // Redo function
  const handleRedo = () => {
    if (!selectedElement || !activePageId) return;
    
    const elementData = mockupStyles[activePageId]?.[selectedElement.id];
    if (!elementData || elementData.future.length === 0) return;
    
    setMockupStyles(prev => {
      const pageStyles = prev[activePageId];
      const element = pageStyles[selectedElement.id];
      const newFuture = [...element.future];
      const nextState = newFuture.shift()!;
      const newHistory = [...element.history, element.current];
      
      return {
        ...prev,
        [activePageId]: {
          ...pageStyles,
          [selectedElement.id]: {
            current: nextState,
            history: newHistory,
            future: newFuture,
          },
        },
      };
    });
    
    // Apply the next state to iframe
    const nextState = elementData.future[0];
    applyStateToIframe(selectedElement.id, nextState);
  };

  // Apply a state to iframe (for undo/redo and page switch restore)
  const applyStateToIframe = (elementId: string, state: { styles: { [property: string]: string }; html: string | null; attributes?: { [attribute: string]: string } }) => {
    if (!iframeRef.current?.contentWindow) return;

    if (state.html !== null) {
      iframeRef.current.contentWindow.postMessage({
        type: 'APPLY_VARIATION',
        elementId,
        newHtml: state.html,
      }, '*');
    } else {
      iframeRef.current.contentWindow.postMessage({
        type: 'RESTORE_ORIGINAL',
        elementId,
        styles: state.styles,
      }, '*');
    }

    // Apply attributes (e.g., image src)
    if (state.attributes) {
      Object.entries(state.attributes).forEach(([attribute, value]) => {
        iframeRef.current!.contentWindow!.postMessage({
          type: 'UPDATE_ELEMENT_ATTRIBUTE',
          elementId,
          attribute,
          value,
        }, '*');
      });
    }
  };

  // Handle page link change for an element
  const handlePageLinkChange = (elementId: string, targetPageId: string | null) => {
    if (!activePageId) return;

    setPageLinks(prev => {
      const pageLinksForCurrentPage = prev[activePageId] ? { ...prev[activePageId] } : {};

      if (targetPageId === null || targetPageId === '') {
        delete pageLinksForCurrentPage[elementId];
      } else {
        pageLinksForCurrentPage[elementId] = targetPageId;
      }

      return {
        ...prev,
        [activePageId]: pageLinksForCurrentPage,
      };
    });

    // Notify iframe to show/hide link indicator
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SET_PAGE_LINK',
        elementId,
        targetPageId,
      }, '*');
    }
  };

  const getCurrentPageLink = (): string | null => {
    if (!activePageId || !selectedElement) return null;
    return pageLinks[activePageId]?.[selectedElement.id] || null;
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
          style={{ left: sidebarExpanded ? '310px' : '0px' }}
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
                onStyleChange={handleStyleChangeWithHistory}
                onAttributeChange={handleAttributeChange}
                availablePages={mockups}
                currentPageLink={getCurrentPageLink()}
                onPageLinkChange={handlePageLinkChange}
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
                key={`mockup - ${activeMockup.id}-${activeMockup.html.length}`}
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