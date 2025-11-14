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

  // Create the settings panel component
  const SettingsPanel: React.FC = () => (
    <div
      id="settings-panel"
      style={{
        position: 'fixed',
        padding: '12px',
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'none',
        width: '250px',
        maxHeight: 'calc(100vh - 100px)', // Prevent panel from exceeding viewport
        overflowY: 'auto',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '8px',
          borderBottom: '1px solid #eee',
          padding: '0 0 8px 0'
        }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Edit Styles</h3>
        
      </div>

      <div style={{ overflowY: 'auto' }}>
        <div className="style-input">
          <label>Width:</label>
          <input type="text" data-style="width" placeholder="e.g., 100px, 50%" />
        </div>

        <div className="style-input">
          <label>Height:</label>
          <input type="text" data-style="height" placeholder="e.g., 100px" />
        </div>

        <div className="style-input">
          <label>Background Color:</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="color" data-style="backgroundColor" style={{ width: '50px' }} />
            <input type="text" data-style="backgroundColor" placeholder="#ffffff" />
          </div>
        </div>

        <div className="style-input">
          <label>Text Color:</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="color" data-style="color" style={{ width: '50px' }} />
            <input type="text" data-style="color" placeholder="#000000" />
          </div>
        </div>

        <div className="style-input">
          <label>Font Size:</label>
          <input type="text" data-style="fontSize" placeholder="e.g., 16px" />
        </div>

        <div className="style-input">
          <label>Padding:</label>
          <input type="text" data-style="padding" placeholder="e.g., 10px" />
        </div>

        <div className="style-input">
          <label>Margin:</label>
          <input type="text" data-style="margin" placeholder="e.g., 10px" />
        </div>

        <div className="style-input">
          <label>Border Radius:</label>
          <input type="text" data-style="borderRadius" placeholder="e.g., 4px" />
        </div>
      </div>
    </div>
  );

  // Convert the settings panel to a string
  const panelString = ReactDOMServer.renderToString(<SettingsPanel />);

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
        }
        .editable-element:hover {
          outline: 2px dashed #2196F3;
          cursor: pointer;
        }
        .selected {
          outline: 2px solid #2196F3 !important;
        }
        .style-input {
          margin-bottom: 8px;
          padding: 0 4px;
        }
        .style-input label {
          display: block;
          margin-bottom: 2px;
          font-size: 12px;
          color: #666;
        }
        .style-input input {
          width: 100%;
          padding: 4px 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          box-sizing: border-box;
          height: 28px;
        }
        /* Group similar inputs */
        .input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .input-group .style-input {
          flex: 1;
          margin-bottom: 0;
        }
        #settings-panel button:hover {
          background: #e5e5e5;
        }
      </style>
    `;

    const script = `
      <script>
        let selectedElement = null;
        const panel = document.getElementById('settings-panel');

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
                styles: window.getComputedStyle(element).cssText
              }, '*');
            }
            
            // Position and show panel
            const rect = element.getBoundingClientRect();
            panel.style.display = 'block';
            panel.style.top = (rect.bottom + 10) + 'px';
            panel.style.left = rect.left + 'px';

            // Update input values
            const style = window.getComputedStyle(element);
            panel.querySelectorAll('input').forEach(input => {
              const property = input.dataset.style;
              if (input.type === 'color') {
                input.value = rgbToHex(style[property]);
              } else {
                input.value = style[property];
              }
            });
          });
        });

        // Handle style changes
        panel.querySelectorAll('input').forEach(input => {
          const updateStyle = (value) => {
            if (selectedElement) {
              const property = input.dataset.style;
              selectedElement.style[property] = value;
              
              // Update paired inputs (color inputs)
              const pairedInputs = panel.querySelectorAll(\`[data-style="\${property}"]\`);
              pairedInputs.forEach(paired => {
                if (paired !== input) {
                  paired.value = value;
                }
              });
            }
          };

          input.addEventListener('change', (e) => updateStyle(e.target.value));
          input.addEventListener('input', (e) => updateStyle(e.target.value));
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
          const isClickOutside = !panel.contains(e.target) && 
                               !e.target.classList.contains('editable-element');
          if (isClickOutside) {
            closePanel();
          }
        });

        function closePanel() {
          if (selectedElement) {
            selectedElement.classList.remove('selected');
            selectedElement = null;
          }
          panel.style.display = 'none';
        }

        function resetStyles() {
          if (selectedElement) {
            selectedElement.removeAttribute('style');
            selectedElement.classList.add('selected');
            
            // Update input values
            const style = window.getComputedStyle(selectedElement);
            panel.querySelectorAll('input').forEach(input => {
              const property = input.dataset.style;
              if (input.type === 'color') {
                input.value = rgbToHex(style[property]);
              } else {
                input.value = style[property];
              }
            });
          }
        }

        function rgbToHex(rgb) {
          if (!rgb || rgb.startsWith('#')) return rgb || '#000000';
          
          const matches = rgb.match(/^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$/);
          if (!matches) return '#000000';

          const r = parseInt(matches[1]).toString(16).padStart(2, '0');
          const g = parseInt(matches[2]).toString(16).padStart(2, '0');
          const b = parseInt(matches[3]).toString(16).padStart(2, '0');

          return \`#\${r}\${g}\${b}\`;
        }

        // Notify parent frame of changes if needed
        function notifyChanges() {
          if (window.parent && window.parent.postMessage) {
            const elements = Array.from(document.querySelectorAll('.editable-element'));
            const styles = elements.map(el => ({
              id: el.dataset.elementId,
              styles: el.style.cssText
            }));
            window.parent.postMessage({ type: 'STYLES_UPDATED', styles }, '*');
          }
        }
          // Listen for variation application from parent
        window.addEventListener('message', function(event) {
          console.log('Iframe received message:', event.data.type);

          if (event.data.type === 'APPLY_VARIATION') {
            const elementId = event.data.elementId;
            const newHtml = event.data.newHtml;
            
             console.log('🟢 Applying variation:', {
              elementId: elementId,
              newHtml: newHtml.substring(0, 100)
            });

            const element = document.querySelector('[data-element-id="' + elementId + '"]');
            console.log('🟢 Found element:', !!element);

            if (element && newHtml) {
              // Parse new HTML
              const temp = document.createElement('div');
              temp.innerHTML = newHtml;
              const newElement = temp.firstElementChild;

              console.log('🟢 Parsed new element:', !!newElement);

              if (newElement) {
                // Preserve the element ID
                newElement.setAttribute('data-element-id', elementId);
                newElement.classList.add('editable-element');
                
                console.log('🟢 About to replace element');

                // Store the old click handler
                const clickHandler = function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Deselect previous element
                  if (selectedElement) {
                    selectedElement.classList.remove('selected');
                  }
                  
                  selectedElement = newElement;
                  newElement.classList.add('selected');
                  
                  // Position and show panel
                  const rect = newElement.getBoundingClientRect();
                  panel.style.display = 'block';
                  panel.style.top = (rect.bottom + 10) + 'px';
                  panel.style.left = rect.left + 'px';

                  // Update input values
                  const style = window.getComputedStyle(newElement);
                  panel.querySelectorAll('input').forEach(function(input) {
                    const property = input.dataset.style;
                    if (input.type === 'color') {
                      input.value = rgbToHex(style[property]);
                    } else {
                      input.value = style[property];
                    }
                  });
                  
                  // Notify parent of element selection for variations
                  if (window.parent && window.parent.postMessage) {
                    window.parent.postMessage({
                      type: 'ELEMENT_SELECTED',
                      elementId: newElement.dataset.elementId,
                      elementHtml: newElement.outerHTML,
                      elementType: detectElementType(newElement),
                      styles: window.getComputedStyle(newElement).cssText
                    }, '*');
                  }
                };
                
                // Replace in DOM
                element.replaceWith(newElement);
                
                console.log('✅ Element replaced successfully!');

                // Attach click handler to new element
                newElement.addEventListener('click', clickHandler);
                
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
        });
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
          ${panelString}
          ${script}
        </body>
      </html>
    `;
  };

  return generateHTML();
};
