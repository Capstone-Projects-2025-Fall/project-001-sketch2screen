import { version } from '../../package.json';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Welcome message box that shows on first visit
 */
export default function WelcomeDialog({ isOpen, onClose }: WelcomeDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '600px',
          width: '90%',
          margin: '0 16px',
          padding: '24px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', margin: 0 }}>
            Welcome to Sketch2Screen!
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '24px',
              lineHeight: '20px',
              padding: '4px',
            }}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {/* Version */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{
            display: 'inline-block',
            fontSize: '12px',
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '4px 8px',
            borderRadius: '4px',
          }}>
            Version {version}
          </span>
        </div>

        {/* Welcome Message */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', marginBottom: '12px' }}>
            Transform your hand-drawn sketches into functional UI components and production-ready code with the power of AI.
          </p>
          <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
            Draw your design on the canvas, click Generate, and watch as your sketches transform into code!
          </p>
        </div>

        {/* Changelog */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
            What's New
          </h3>
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e5e7eb',
          }}>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.8',
            }}>
              <li>Real-time collaboration - work together with your team</li>
              <li>AI-powered code generation - transform sketches to HTML/CSS</li>
              <li></li>
              <li>Export individual pages as HTML files</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
