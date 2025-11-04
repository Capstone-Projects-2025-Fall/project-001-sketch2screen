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
  
  <EditableContentReactExample content={content} />
*/

export function EditableContentReactExample({ content }) {
  const [selectedElement, setSelectedElement] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find all elements inside the content div
    const elements = container.querySelectorAll('.content *');

    // Make each element clickable
    elements.forEach(element => {
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
    });

    // Handle clicks outside of elements
    const handleOutsideClick = (e) => {
      if (!container.contains(e.target) || e.target === container) {
        if (selectedElement) {
          selectedElement.style.outline = 'none';
        }
        setSelectedElement(null);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [selectedElement]);

  // Color picker component
  const ColorPicker = ({ label, initialColor, onChange }) => (
    <div style={{ marginBottom: '10px' }}>
      <label style={{ display: 'block', marginBottom: '5px' }}>{label}:</label>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="color"
          defaultValue={initialColor}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '50px', height: '30px' }}
        />
        <input
          type="text"
          defaultValue={initialColor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          style={{ flex: 1, padding: '5px' }}
        />
      </div>
    </div>
  );

  // Input field component
  const StyleInput = ({ label, property, placeholder }) => (
    <div style={{ marginBottom: '10px' }}>
      <label style={{ display: 'block', marginBottom: '5px' }}>{label}:</label>
      <input
        type="text"
        defaultValue={selectedElement?.style[property]}
        onChange={(e) => updateStyle(property, e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '5px' }}
      />
    </div>
  );

  // Update style of selected element
  const updateStyle = (property, value) => {
    if (selectedElement) {
      selectedElement.style[property] = value;
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

      {/* Settings Panel */}
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
            minWidth: '250px',
            maxWidth: '300px'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Edit Styles</h3>
            <button
              onClick={() => {
                selectedElement.style.outline = 'none';
                setSelectedElement(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '5px'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '5px' }}>
            {/* Dimensions */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <StyleInput
                label="Width"
                property="width"
                placeholder="e.g., 100px"
              />
              <StyleInput
                label="Height"
                property="height"
                placeholder="e.g., 100px"
              />
            </div>

            {/* Colors */}
            <ColorPicker
              label="Background Color"
              initialColor="#ffffff"
              onChange={(value) => updateStyle('backgroundColor', value)}
            />
            <ColorPicker
              label="Text Color"
              initialColor="#000000"
              onChange={(value) => updateStyle('color', value)}
            />

            {/* Text styles */}
            <StyleInput
              label="Font Size"
              property="fontSize"
              placeholder="e.g., 16px"
            />

            {/* Spacing */}
            <StyleInput
              label="Padding"
              property="padding"
              placeholder="e.g., 10px"
            />
            <StyleInput
              label="Margin"
              property="margin"
              placeholder="e.g., 10px"
            />

            {/* Border */}
            <StyleInput
              label="Border Radius"
              property="borderRadius"
              placeholder="e.g., 4px"
            />
            <StyleInput
              label="Border"
              property="border"
              placeholder="e.g., 1px solid #ccc"
            />
          </div>

          {/* Reset button */}
          <button
            onClick={() => {
              if (selectedElement) {
                selectedElement.removeAttribute('style');
                selectedElement.style.outline = '2px solid blue';
              }
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
            Reset Styles
          </button>
        </div>
      )}
    </div>
  );
}