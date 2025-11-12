// frontend/src/components/VariationSidebar.tsx
import { useState } from 'react';
import { useVariations } from '../hooks/useVariations';
import PromptInput from './PromptInput';
import VariationPreview from './VariationPreview';

type VariationSidebarProps = {
  elementId: string | null;
  elementHtml: string | null;
  elementType: string | null;
  onApplyVariation: (html: string) => void;
  onClose: () => void;
};

/**
 * Main sidebar component for displaying and managing design variations
 * Shows element ID, prompt input, and variation previews
 */
export default function VariationSidebar({
  elementId,
  elementHtml,
  elementType,
  onApplyVariation,
  onClose,
}: VariationSidebarProps) {
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number | null>(null);
  
  const {
    variations,
    loading,
    error,
    generateAuto,
    generateCustom,
  } = useVariations();

  // Generate auto variations when element is first selected
  useState(() => {
    if (elementHtml && elementType && !variations && !loading) {
      generateAuto(elementHtml, elementType);
    }
  });

  const handleCustomPromptSubmit = (prompt: string) => {
    if (elementHtml && elementType) {
      generateCustom(elementHtml, elementType, prompt);
      setSelectedVariationIndex(null); // Reset selection
    }
  };

  const handleVariationClick = (html: string, index: number) => {
    setSelectedVariationIndex(index);
    onApplyVariation(html);
  };

  if (!elementId) {
    return null;
  }

  return (
    <div
      style={{
        width: '320px',
        height: '100%',
        background: 'white',
        borderLeft: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #eee',
          background: '#f9f9f9',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Design Options
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              color: '#666',
            }}
            title="Close sidebar"
          >
            ×
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Element ID display */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#666',
              marginBottom: '6px',
              fontWeight: 500,
            }}
          >
            Element ID:
          </label>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              padding: '8px',
              background: '#f5f5f5',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
            }}
          >
            <code
              style={{
                flex: 1,
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#333',
              }}
            >
              {elementId}
            </code>
            <button
              onClick={() => setShowPromptInput(!showPromptInput)}
              style={{
                background: showPromptInput ? '#2196F3' : '#f0f0f0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: '16px',
                transition: 'all 0.2s',
              }}
              title={showPromptInput ? 'Hide prompt input' : 'Custom prompt'}
            >
              ✨
            </button>
          </div>
        </div>

        {/* Custom prompt input (collapsible) */}
        {showPromptInput && (
          <PromptInput
            onSubmit={handleCustomPromptSubmit}
            loading={loading}
          />
        )}

        {/* Current element preview */}
        {elementHtml && (
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#666',
                marginBottom: '6px',
                fontWeight: 500,
              }}
            >
              Current Design:
            </label>
            <VariationPreview
              html={elementHtml}
              index={-1}
              onClick={() => {}}
              isSelected={false}
            />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              color: '#666',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #2196F3',
                borderRadius: '50%',
                margin: '0 auto 12px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ margin: 0, fontSize: '13px' }}>
              Generating variations...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            style={{
              padding: '12px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              color: '#c33',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* Variations */}
        {variations && variations.length > 0 && !loading && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#666',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              Variations:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {variations.map((html, index) => (
                <VariationPreview
                  key={index}
                  html={html}
                  index={index}
                  onClick={() => handleVariationClick(html, index)}
                  isSelected={selectedVariationIndex === index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !variations && !error && (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              color: '#999',
              fontSize: '13px',
            }}
          >
            <p>Select an element to see design variations</p>
          </div>
        )}
      </div>

      {/* CSS for spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .click-hint {
            opacity: 0 !important;
          }
          *:hover > .click-hint {
            opacity: 1 !important;
          }
        `}
      </style>
    </div>
  );
}