import { version } from '../../package.json';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px', marginTop: '12px', position: 'relative' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
          }}>
            Welcome to{' '}
            <span style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Sketch2Screen
            </span>!
          </h1>
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
              position: 'absolute',
              right: 0,
              top: -18,
            }}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {/* Version and GitHub Link */}
        <div style={{ marginBottom: '36 px', textAlign: 'center', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
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
          <a
            href="https://github.com/Capstone-Projects-2025-Fall/project-001-sketch2screen"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '12px',
              color: '#2563eb',
              textDecoration: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: '#eff6ff',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dbeafe')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
          >
            <svg style={{ width: '14px', height: '14px', marginRight: '4px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>

        {/* Changelog */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
            What's New:
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
              <li>• Real-time collaboration - work together with your team</li>
              <li>• AI-powered code generation - transform sketches to HTML/CSS</li>
              <li>• Multi-page sketch support with individual exports</li>
              <li>• Export individual pages as HTML files</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
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
