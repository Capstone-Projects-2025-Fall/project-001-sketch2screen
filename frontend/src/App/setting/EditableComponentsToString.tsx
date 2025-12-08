import React from 'react';
import ReactDOMServer from 'react-dom/server';

interface EditableComponentsProps {
  htmlContent: string; // The HTML content from backend
  onStyleChange?: (elements: Element[]) => void; // Optional callback for parent component
}

export const EditableComponents: React.FC<EditableComponentsProps> = ({ 
  htmlContent,
  onStyleChange 
}) => {
  // Generate unique IDs for elements
  const addUniqueIds = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let idCounter = 0;

    const addIds = (element: Element) => {
      element.setAttribute('data-element-id', `el-${idCounter++}`);
      element.classList.add('editable-element');
      Array.from(element.children).forEach(addIds);
    };

    Array.from(doc.body.children).forEach(addIds);
    return doc.body.innerHTML;
  };


  // Generate the complete HTML with styles, content, and JavaScript
  const generateHTML = (): string => {
    const styles = `
      <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
    }
    .editable-element {
      transition: outline 0.2s ease;
      pointer-events: auto !important;
      position: relative;
    }
    .editable-element:hover {
      outline: 2px dashed #2196F3;
      cursor: pointer;
    }
    .selected {
      outline: 2px solid #2196F3 !important;
      pointer-events: none;
    }
    .selected > .editable-element {
      pointer-events: auto;
    }
    /* Page link indicator */
    .has-page-link {
      outline: 2px solid #10b981 !important;
    }
    .has-page-link:hover {
      outline: 2px solid #059669 !important;
    }
    .page-link-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #10b981;
      color: white;
      font-size: 10px;
      padding: 2px 4px;
      border-radius: 4px;
      z-index: 1000;
      pointer-events: none;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
  </style>
    `;

    const script = `
      <script>
        let selectedElement = null;

        // Detect element type for variations
        function detectElementType(element) {
          const tag = element.tagName.toLowerCase();
          const classes = element.className || '';
          
          if (tag === 'button' || classes.includes('btn')) return 'button';
          if (tag === 'input' || tag === 'textarea' || tag === 'select') return 'input';
          if (tag === 'form') return 'form';
          if (classes.includes('card')) return 'card';
          if (tag === 'nav' || classes.includes('nav')) return 'navigation';
          if (tag === 'header') return 'header';
          if (tag === 'footer') return 'footer';
          if (tag === 'aside' || classes.includes('sidebar')) return 'sidebar';
          if (tag === 'section') return 'section';
          
          return tag;
        }

        // Add click handlers to all editable elements
        document.querySelectorAll('.editable-element').forEach(element => {
          element.addEventListener('click', (e) => {

            const clickedElement = e.target.closest('.editable-element');


            e.preventDefault();
            e.stopPropagation();
            
            // Deselect previous element
            if (selectedElement) {
              selectedElement.classList.remove('selected');
            }
            
            selectedElement = element;
            element.classList.add('selected');

            // Notify parent of element selection for variations
            if (window.parent && window.parent.postMessage) {
              window.parent.postMessage({
                type: 'ELEMENT_SELECTED',
                elementId: element.dataset.elementId,
                elementHtml: element.outerHTML,
                elementType: detectElementType(element),
              }, '*');
          }
          });
        });

        // Store original HTML for each element (for undo/redo restoration)
        const originalElements = new Map();
        document.querySelectorAll('.editable-element').forEach(element => {
          originalElements.set(element.dataset.elementId, element.outerHTML);
        });

        // Listen for messages from parent - MUST be set up BEFORE notifying parent
        window.addEventListener('message', function(event) {
          // Get element styles request
          if (event.data.type === 'GET_ELEMENT_STYLES') {
            const elementId = event.data.elementId;
            const element = document.querySelector('[data-element-id="' + elementId + '"]');
            
            if (element) {
              const computedStyles = window.getComputedStyle(element);
              window.parent.postMessage({
                type: 'ELEMENT_STYLES',
                elementId: elementId,
                styles: {
                  width: computedStyles.width,
                  height: computedStyles.height,
                  backgroundColor: computedStyles.backgroundColor,
                  color: computedStyles.color,
                  fontSize: computedStyles.fontSize,
                  padding: computedStyles.padding,
                  margin: computedStyles.margin,
                  borderRadius: computedStyles.borderRadius,
                }
              }, '*');
            }
          }
          
          // Get element content request
          if (event.data.type === 'GET_ELEMENT_CONTENT') {
            const elementId = event.data.elementId;
            const element = document.querySelector('[data-element-id="' + elementId + '"]');
            
            if (element) {
              window.parent.postMessage({
                type: 'ELEMENT_CONTENT',
                elementId: elementId,
                content: element.innerText // Sends the current text back to the sidebar
              }, '*');
            }
          }

          //Get Element attribute for img src
          if (event.data.type === 'GET_ELEMENT_ATTRIBUTE') {
            const elementId = event.data.elementId;
            const attribute = event.data.attribute;
            const element = document.querySelector('[data-element-id="' + elementId + '"]');
            
            if (element) {
              window.parent.postMessage({
                type: 'ELEMENT_ATTRIBUTE',
                elementId: elementId,
                attribute: attribute,
                value: element.getAttribute(attribute)
              }, '*');
            }
          }

          //Update element attribute
          if (event.data.type === 'UPDATE_ELEMENT_ATTRIBUTE') {
            const elementId = event.data.elementId;
            const attribute = event.data.attribute; // e.g., 'src'
            const value = event.data.value;
            
            const element = document.querySelector('[data-element-id="' + elementId + '"]');
            if (element) {
              element.setAttribute(attribute, value);
            }
          }
          
          // Update element style
          if (event.data.type === 'UPDATE_ELEMENT_STYLE') {
            const elementId = event.data.elementId;
            const property = event.data.property;
            const value = event.data.value;
            
            const element = document.querySelector('[data-element-id="' + elementId + '"]');
            if (element) {
              element.style[property] = value;
            }
          }
          
          if (event.data.type === 'UPDATE_ELEMENT_CONTENT') {
            const elementId = event.data.elementId;
            const content = event.data.content;
            
            const element = document.querySelector('[data-element-id="' + elementId + '"]');
            if (element) {
              element.innerText = content; // Actually updates the text on screen
            }
          }

          
          // Apply variation
          if (event.data.type === 'APPLY_VARIATION') {
            const elementId = event.data.elementId;
            const newHtml = event.data.newHtml;
            
            const element = document.querySelector('[data-element-id="' + elementId + '"]');
            
            if (element && newHtml) {
              const temp = document.createElement('div');
              temp.innerHTML = newHtml;
              const newElement = temp.firstElementChild;

              if (newElement) {
                // Preserve the element ID
                newElement.setAttribute('data-element-id', elementId);
                newElement.classList.add('editable-element');
                
                // Replace in DOM
                element.replaceWith(newElement);
                
                // Attach click handler to new element
                newElement.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (selectedElement) {
                    selectedElement.classList.remove('selected');
                  }
                  
                  selectedElement = newElement;
                  newElement.classList.add('selected');
                  
                  if (window.parent && window.parent.postMessage) {
                    window.parent.postMessage({
                      type: 'ELEMENT_SELECTED',
                      elementId: newElement.dataset.elementId,
                      elementHtml: newElement.outerHTML,
                      elementType: detectElementType(newElement),
                    }, '*');
                  }
                });
                
                // Notify parent of successful application
                if (window.parent && window.parent.postMessage) {
                  window.parent.postMessage({
                    type: 'VARIATION_APPLIED',
                    elementId: elementId
                  }, '*');
                }
              }
            }
          }
          // Restore original element and apply styles
          if (event.data.type === 'RESTORE_ORIGINAL') {
            const elementId = event.data.elementId;
            const styles = event.data.styles;
            
            const element = document.querySelector('[data-element-id="' + elementId + '"]');
            const originalHtml = originalElements.get(elementId);
            
            if (element && originalHtml) {
              // Parse original HTML
              const temp = document.createElement('div');
              temp.innerHTML = originalHtml;
              const originalElement = temp.firstElementChild;
              
              if (originalElement) {
                // Replace current element with original
                element.replaceWith(originalElement);
                
                // Apply saved styles
                if (styles) {
                  Object.keys(styles).forEach(function(property) {
                    originalElement.style[property] = styles[property];
                  });
                }
                
                // Reattach click handler
                originalElement.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (selectedElement) {
                    selectedElement.classList.remove('selected');
                  }
                  
                  selectedElement = originalElement;
                  originalElement.classList.add('selected');
                  
                  if (window.parent && window.parent.postMessage) {
                    window.parent.postMessage({
                      type: 'ELEMENT_SELECTED',
                      elementId: originalElement.dataset.elementId,
                      elementHtml: originalElement.outerHTML,
                      elementType: detectElementType(originalElement),
                    }, '*');
                  }
                });
              }
            }
          }

          // Inject multiple styles at once (used on page load)
          if (event.data.type === 'INJECT_STYLES') {
            const stylesToInject = event.data.styles;

            if (stylesToInject) {
              Object.keys(stylesToInject).forEach(function(elementId) {
                const styleData = stylesToInject[elementId];
                const element = document.querySelector('[data-element-id="' + elementId + '"]');

                if (element && styleData) {
                  // Apply each style property
                  Object.keys(styleData).forEach(function(property) {
                    element.style[property] = styleData[property];
                  });
                }
              });
            }
          }

          // Set page link for an element
          if (event.data.type === 'SET_PAGE_LINK') {
            const elementId = event.data.elementId;
            const targetPageId = event.data.targetPageId;

            const element = document.querySelector('[data-element-id="' + elementId + '"]');
            if (element) {
              // Remove existing badge if any
              const existingBadge = element.querySelector('.page-link-badge');
              if (existingBadge) {
                existingBadge.remove();
              }

              if (targetPageId) {
                // Add link indicator
                element.classList.add('has-page-link');
                element.setAttribute('data-page-link', targetPageId);

                // Add badge
                const badge = document.createElement('span');
                badge.className = 'page-link-badge';
                badge.textContent = '🔗';
                element.style.position = 'relative';
                element.appendChild(badge);
              } else {
                // Remove link indicator
                element.classList.remove('has-page-link');
                element.removeAttribute('data-page-link');
              }
            }
          }

          // Inject page links (used on page load)
          if (event.data.type === 'INJECT_PAGE_LINKS') {
            const links = event.data.links;

            if (links) {
              Object.keys(links).forEach(function(elementId) {
                const targetPageId = links[elementId];
                const element = document.querySelector('[data-element-id="' + elementId + '"]');

                if (element && targetPageId) {
                  element.classList.add('has-page-link');
                  element.setAttribute('data-page-link', targetPageId);

                  // Add badge
                  const badge = document.createElement('span');
                  badge.className = 'page-link-badge';
                  badge.textContent = '🔗';
                  element.style.position = 'relative';
                  element.appendChild(badge);
                }
              });
            }
          }

        });

        // Notify parent that iframe has loaded - AFTER message listener is set up
        if (window.parent && window.parent.postMessage) {
          window.parent.postMessage({
            type: 'IFRAME_LOADED'
          }, '*');
        }
  </script>
      `;

    // Combine everything into a complete HTML document
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
          ${styles}
        </head>
        <body>
          ${addUniqueIds(htmlContent)}
          ${script}
        </body>
      </html>
    `;
  };

  return generateHTML();
};
