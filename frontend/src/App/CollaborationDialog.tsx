import { useState, useEffect } from 'react';

interface CollaborationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Current collaboration ID */
  collabId: string;
  /** Callback when user confirms with their name */
  onConfirm: (username: string) => void;
  /** Whether we're still waiting for username or showing the link */
  needsUsername: boolean;
}

/**
 * Dialog component for displaying and managing collaboration links
 */
export default function CollaborationDialog({ 
  isOpen, 
  onClose, 
  collabId,
  onConfirm,
  needsUsername 
}: CollaborationDialogProps) {
  const [copied, setCopied] = useState(false);
  const [collaborationUrl, setCollaborationUrl] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (isOpen && collabId) {
      // Generate the collaboration URL
      const url = `${window.location.origin}${window.location.pathname}?collab=${collabId}`;
      setCollaborationUrl(url);
    }
  }, [isOpen, collabId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(collaborationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = collaborationUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Fallback copy failed:', e);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleSubmitUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      onConfirm(trimmedUsername);
    }
  };

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
          maxWidth: '500px',
          width: '90%',
          margin: '0 16px',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>
              {needsUsername ? 'Join Collaboration' : 'Collaboration Link'}
            </h2>
          </div>
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

        {/* Content */}
        {needsUsername ? (
          // Username input form
          <form onSubmit={handleSubmitUsername}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                Enter your name to start collaborating. Others will see your cursor with this name.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="username" 
                  style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: 500, 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}
                >
                  Your Name
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., John Doe"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!username.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: username.trim() ? '#2563eb' : '#d1d5db',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: username.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (username.trim()) e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  if (username.trim()) e.currentTarget.style.backgroundColor = '#2563eb';
                }}
              >
                Start Collaborating
              </button>
            </div>
          </form>
        ) : (
          // Collaboration link display
          <>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                Share this link with others to collaborate in real-time. Everyone with this link can view and edit the sketches together.
              </p>

              {/* URL Display */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '12px', 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb',
                marginBottom: '16px',
              }}>
                <input
                  type="text"
                  value={collaborationUrl}
                  readOnly
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    color: '#374151',
                    outline: 'none',
                  }}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={handleCopyLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
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
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Info */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'start', 
                gap: '8px', 
                padding: '12px', 
                backgroundColor: '#eff6ff', 
                borderRadius: '8px',
              }}>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#2563eb" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
                  You'll see other collaborators' cursors with their names in real-time.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}