/**
 * Utility function to extract HTML from iframe with all applied style changes
 * This captures the current state of the editable components with all modifications
 */

export const exportModifiedHTML = (iframeRef: React.MutableRefObject<HTMLIFrameElement | null>): string | null => {
  if (!iframeRef.current) {
    console.error("Iframe reference not available");
    return null;
  }

  try {
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    
    if (!iframeDoc) {
      console.error("Cannot access iframe document");
      return null;
    }

    // Clone the entire content to preserve styles
    const clonedDoc = iframeDoc.documentElement.cloneNode(true) as HTMLElement;
    
    // Remove the settings panel from the exported HTML
    const settingsPanel = clonedDoc.querySelector('#settings-panel');
    if (settingsPanel) {
      settingsPanel.remove();
    }

    // Get all elements with applied styles
    const editableElements = clonedDoc.querySelectorAll('.editable-element');
    
    editableElements.forEach((element) => {
      // Convert inline styles to a style attribute that will persist
      const styles = (element as HTMLElement).style;
      
      // Remove the selection outline class if present
      (element as HTMLElement).classList.remove('selected');
      
      // Preserve all inline styles applied by the user
      if (styles.cssText) {
        (element as HTMLElement).setAttribute('data-applied-styles', styles.cssText);
      }
    });

    // Return the modified HTML as a string
    return clonedDoc.outerHTML;
  } catch (error) {
    console.error("Error exporting HTML:", error);
    return null;
  }
};

/**
 * Extract just the body content (without html/head tags) with all changes
 */
export const exportModifiedHTMLBody = (iframeRef: React.MutableRefObject<HTMLIFrameElement | null>): string | null => {
  if (!iframeRef.current) {
    console.error("Iframe reference not available");
    return null;
  }

  try {
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    
    if (!iframeDoc) {
      console.error("Cannot access iframe document");
      return null;
    }

    // Clone the body
    const bodyClone = iframeDoc.body.cloneNode(true) as HTMLElement;
    
    // Remove the settings panel
    const settingsPanel = bodyClone.querySelector('#settings-panel');
    if (settingsPanel) {
      settingsPanel.remove();
    }

    // Remove editable-element class and selection styles
    const editableElements = bodyClone.querySelectorAll('.editable-element');
    editableElements.forEach((element) => {
      (element as HTMLElement).classList.remove('editable-element', 'selected');
    });

    return bodyClone.innerHTML;
  } catch (error) {
    console.error("Error exporting HTML body:", error);
    return null;
  }
};

/**
 * Extract styles as a separate CSS object for each element
 */
export const exportElementStyles = (iframeRef: React.MutableRefObject<HTMLIFrameElement | null>): Record<string, string> => {
  const styles: Record<string, string> = {};

  if (!iframeRef.current) {
    console.error("Iframe reference not available");
    return styles;
  }

  try {
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    
    if (!iframeDoc) {
      console.error("Cannot access iframe document");
      return styles;
    }

    const editableElements = iframeDoc.querySelectorAll('.editable-element[data-element-id]');
    
    editableElements.forEach((element) => {
      const elementId = (element as HTMLElement).getAttribute('data-element-id');
      const appliedStyles = (element as HTMLElement).style.cssText;
      
      if (elementId && appliedStyles) {
        styles[elementId] = appliedStyles;
      }
    });

    return styles;
  } catch (error) {
    console.error("Error exporting element styles:", error);
    return styles;
  }
};

/**
 * Create a downloadable HTML file with all changes
 */
export const downloadModifiedHTML = (
  iframeRef: React.MutableRefObject<HTMLIFrameElement | null>,
  filename: string = "modified-mockup.html"
): void => {
  const html = exportModifiedHTML(iframeRef);
  
  if (!html) {
    alert("Failed to export HTML");
    return;
  }

  const blob = new Blob([html], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Get the modified HTML as a clean version without editor classes
 */
export const getCleanModifiedHTML = (iframeRef: React.MutableRefObject<HTMLIFrameElement | null>): string | null => {
  const html = exportModifiedHTMLBody(iframeRef);
  
  if (!html) return null;

  // Remove any data attributes used for editing
  const cleanHTML = html
    .replace(/\sdata-element-id="[^"]*"/g, '')
    .replace(/\sdata-style="[^"]*"/g, '')
    .replace(/\sdata-applied-styles="[^"]*"/g, '');

  return cleanHTML;
};