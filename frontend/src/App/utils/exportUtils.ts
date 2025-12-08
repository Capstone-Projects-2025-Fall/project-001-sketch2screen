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

    // Remove all script tags
    const scripts = clonedDoc.querySelectorAll('script');
    scripts.forEach((script) => script.remove());

    // Remove style tags that were added for editor functionality
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach((style) => {
      const content = style.textContent || '';
      // Only remove style tags containing editor-specific selectors
      if (content.includes('.editable-element') || content.includes('#settings-panel')) {
        style.remove();
      }
    });

    // Remove link badge spans (editor visual indicators)
    const linkBadges = clonedDoc.querySelectorAll('.page-link-badge');
    linkBadges.forEach((badge) => badge.remove());

    // Get all elements with applied styles
    const editableElements = clonedDoc.querySelectorAll('.editable-element, .has-page-link, [data-element-id]');

    editableElements.forEach((element) => {
      // Remove the selection outline class if present
      (element as HTMLElement).classList.remove('selected');

      // Remove editor-specific classes
      (element as HTMLElement).classList.remove('editable-element');
      (element as HTMLElement).classList.remove('has-page-link');

      // Remove editor data attributes
      (element as HTMLElement).removeAttribute('data-element-id');
      (element as HTMLElement).removeAttribute('data-page-link');
      (element as HTMLElement).removeAttribute('data-applied-styles');

      // Clean up empty class attributes
      if ((element as HTMLElement).className === '') {
        (element as HTMLElement).removeAttribute('class');
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

    // Remove all script tags
    const scripts = bodyClone.querySelectorAll('script');
    scripts.forEach((script) => script.remove());

    // Remove style tags used for editor
    const styleTags = bodyClone.querySelectorAll('style');
    styleTags.forEach((style) => {
      const content = style.textContent || '';
      if (content.includes('.editable-element') || content.includes('#settings-panel')) {
        style.remove();
      }
    });

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
 * Get the modified HTML as a clean version without editor classes and scripts
 */
export const getCleanModifiedHTML = (iframeRef: React.MutableRefObject<HTMLIFrameElement | null>): string | null => {
  const html = exportModifiedHTMLBody(iframeRef);
  
  if (!html) return null;

  // Remove any data attributes used for editing
  let cleanHTML = html
    .replace(/\sdata-element-id="[^"]*"/g, '')
    .replace(/\sdata-style="[^"]*"/g, '')
    .replace(/\sdata-applied-styles="[^"]*"/g, '');

  // Remove any remaining script tags
  cleanHTML = cleanHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove inline event handlers (onclick, onload, etc.)
  cleanHTML = cleanHTML.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

  return cleanHTML;
};