import React, { useState } from 'react';
import ReactDOMServer from 'react-dom/server';

// Example usage:
/*
  const [content, setContent] = useState(`
    <h1>Initial content</h1>
    <p>Click elements to edit</p>
  `);

  <iframe srcDoc={content} />
*/

export function EditableContentString() {
  const [styles, setStyles] = useState({});
  
  // Function to generate the complete HTML string including scripts
  const generateHTML = () => {
    // Create the style panel component
    const StylePanel = ({ targetId }) => (
      <div
        id="style-panel"
        style={{
          position: 'fixed',
          padding: '15px',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
          minWidth: '250px',
          display: 'none'
        }}
      >
        <h3 style={{ margin: '0 0 15px 0' }}>Edit Styles</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Width:</label>
          <input
            type="text"
            data-style="width"
            placeholder="e.g., 100px"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Height:</label>
          <input
            type="text"
            data-style="height"
            placeholder="e.g., 100px"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Background:</label>
          <input
            type="color"
            data-style="backgroundColor"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Text Color:</label>
          <input
            type="color"
            data-style="color"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Font Size:</label>
          <input
            type="text"
            data-style="fontSize"
            placeholder="e.g., 16px"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Padding:</label>
          <input
            type="text"
            data-style="padding"
            placeholder="e.g., 10px"
          />
        </div>
        <button onclick="closeStylePanel()">Close</button>
      </div>
    );

    // Convert the style panel component to a string
    const stylePanelHTML = ReactDOMServer.renderToString(<StylePanel />);

    // Create the HTML content with embedded JavaScript
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .hoverable:hover {
              outline: 2px dashed blue;
            }
            .selected {
              outline: 2px solid blue !important;
            }
          </style>
        </head>
        <body>
          <div id="content">
            <!-- Your content goes here -->
            <h1 class="hoverable">Edit me!</h1>
            <p class="hoverable">Click any element to edit its styles</p>
            <button class="hoverable">I'm editable too!</button>
          </div>

          ${stylePanelHTML}

          <script>
            let selectedElement = null;
            const stylePanel = document.getElementById('style-panel');

            // Make elements clickable
            document.querySelectorAll('.hoverable').forEach(element => {
              element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Remove previous selection
                if (selectedElement) {
                  selectedElement.classList.remove('selected');
                }
                
                // Update selection
                selectedElement = element;
                element.classList.add('selected');
                
                // Show and position the style panel
                stylePanel.style.display = 'block';
                const rect = element.getBoundingClientRect();
                stylePanel.style.top = rect.bottom + 10 + 'px';
                stylePanel.style.left = rect.left + 'px';

                // Update input values
                const style = window.getComputedStyle(element);
                stylePanel.querySelectorAll('input').forEach(input => {
                  const property = input.dataset.style;
                  input.value = style[property];
                });
              });
            });

            // Handle style input changes
            stylePanel.querySelectorAll('input').forEach(input => {
              input.addEventListener('change', (e) => {
                if (selectedElement) {
                  const property = e.target.dataset.style;
                  selectedElement.style[property] = e.target.value;
                }
              });
            });

            // Close panel when clicking outside
            document.addEventListener('click', (e) => {
              if (!stylePanel.contains(e.target) && 
                  !e.target.classList.contains('hoverable')) {
                closeStylePanel();
              }
            });

            function closeStylePanel() {
              if (selectedElement) {
                selectedElement.classList.remove('selected');
                selectedElement = null;
              }
              stylePanel.style.display = 'none';
            }
          </script>
        </body>
      </html>
    `;

    return html;
  };

  // Function to get the current HTML content
  const getHTMLContent = () => {
    return generateHTML();
  };

  // Usage example of how to get the string
  const iframeContent = getHTMLContent();
  
  // You can return just the string:
  return iframeContent;

  // Or if you want to see it in action:
  /*
  return (
    <iframe 
      srcDoc={iframeContent}
      style={{ width: '100%', height: '500px', border: 'none' }}
    />
  );
  */
}

// Example of how to use it in your component:
/*
export function YourComponent() {
  const content = new EditableContentString().getHTMLContent();
  
  return (
    <iframe 
      srcDoc={content}
      style={{ width: '100%', height: '500px', border: 'none' }}
    />
  );
}
*/