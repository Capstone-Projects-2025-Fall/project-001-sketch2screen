import React, { useState, useRef, useEffect } from 'react';

// Example usage:
/*
  const content = `
    <div>
      <h1>Edit me!</h1>
      <p>Click any element to edit its styles</p>
      <button>I'm editable too!</button>
    </div>
  `;
  
  <EditableContentExample content={content} />
*/

interface Props {
  content: string;
}

export function EditableContentExample({ content }: Props) {
  // Track the currently selected element
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find all elements inside the content div
    const elements = container.querySelectorAll('.content *');

    // Make each element clickable
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        // Add hover effect
        element.addEventListener('mouseover', () => {
          if (element !== selectedElement) {
            element.style.outline = '2px dashed blue';
          }
        });

        element.addEventListener('mouseout', () => {
          if (element !== selectedElement) {
            element.style.outline = 'none';
          }
        });

        // Handle click on element
        element.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Remove highlight from previously selected element
          if (selectedElement) {
            selectedElement.style.outline = 'none';
          }
          
          // Update selected element
          setSelectedElement(element);
          element.style.outline = '2px solid blue';
        });
      }
    });

    // Handle clicks outside of elements
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!container.contains(target) || target === container) {
        if (selectedElement) {
          selectedElement.style.outline = 'none';
        }
        setSelectedElement(null);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [selectedElement]);

  // Update style of selected element
  const updateStyle = (property: string, value: string) => {
    if (selectedElement) {
      selectedElement.style[property as any] = value;
    }
  };

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      {/* Content area */}
      <div 
        ref={containerRef}
        className="content"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Settings Panel - only shows when an element is selected */}
      {selectedElement && (
        <div
          style={{
            position: 'fixed',
            top: selectedElement.getBoundingClientRect().bottom + 10 + 'px',
            left: selectedElement.getBoundingClientRect().left + 'px',
            padding: '15px',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            minWidth: '250px'
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Edit Styles</h3>
          
          {/* Width input */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Width:</label>
            <input
              type="text"
              defaultValue={selectedElement.style.width}
              onChange={(e) => updateStyle('width', e.target.value)}
              placeholder="e.g., 100px or 50%"
              style={{ width: '100%', padding: '5px' }}
            />
          </div>

          {/* Height input */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Height:</label>
            <input
              type="text"
              defaultValue={selectedElement.style.height}
              onChange={(e) => updateStyle('height', e.target.value)}
              placeholder="e.g., 100px"
              style={{ width: '100%', padding: '5px' }}
            />
          </div>

          {/* Background Color input */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Background Color:</label>
            <input
              type="color"
              defaultValue="#ffffff"
              onChange={(e) => updateStyle('backgroundColor', e.target.value)}
              style={{ width: '100%', height: '30px' }}
            />
          </div>

          {/* Text Color input */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Text Color:</label>
            <input
              type="color"
              defaultValue="#000000"
              onChange={(e) => updateStyle('color', e.target.value)}
              style={{ width: '100%', height: '30px' }}
            />
          </div>

          {/* Font Size input */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Font Size:</label>
            <input
              type="text"
              defaultValue={selectedElement.style.fontSize}
              onChange={(e) => updateStyle('fontSize', e.target.value)}
              placeholder="e.g., 16px"
              style={{ width: '100%', padding: '5px' }}
            />
          </div>

          {/* Padding input */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Padding:</label>
            <input
              type="text"
              defaultValue={selectedElement.style.padding}
              onChange={(e) => updateStyle('padding', e.target.value)}
              placeholder="e.g., 10px"
              style={{ width: '100%', padding: '5px' }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              selectedElement.style.outline = 'none';
              setSelectedElement(null);
            }}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '10px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}