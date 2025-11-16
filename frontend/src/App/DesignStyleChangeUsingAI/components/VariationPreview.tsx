// frontend/src/components/VariationPreview.tsx
import { VARIATION_CONFIG } from '../config/variations';

type VariationPreviewProps = {
  html: string;
  index: number;
  onClick: () => void;
  isSelected?: boolean;
};

/**
 * Preview component for a single design variation
 * Renders in a mini-iframe with click to apply
 */
export default function VariationPreview({
  html,
  index,
  onClick,
  isSelected = false,
}: VariationPreviewProps) {
  // Wrap the HTML in a minimal document for iframe
  const wrappedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <style>
          html, body {
            margin: 0;
            padding: 8px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  return (
    <div
      onClick={onClick}
      style={{
        border: isSelected ? '3px solid #2196F3' : '2px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        background: '#f5f5f5',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#2196F3';
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#ddd';
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          background: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 500,
          zIndex: 10,
          pointerEvents: 'auto'
        }}
      >
        Option {index + 1}
      </div>

      {/* Preview iframe */}
      <iframe
        srcDoc={wrappedHtml}
        style={{
          width: `${VARIATION_CONFIG.PREVIEW_WIDTH}px`,
          height: `${VARIATION_CONFIG.PREVIEW_HEIGHT}px`,
          border: 'none',
          display: 'block',
          pointerEvents: 'none'
        }}
        sandbox="allow-same-origin allow-scripts"
        title={`Variation ${index + 1}`}
      />

      {/* Click indicator on hover */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          background: '#2196F3',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 500,
          opacity: 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}
        className="click-hint"
      >
        Click to apply
      </div>
    </div>
  );
}