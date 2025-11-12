// frontend/src/components/PromptInput.tsx
import { useState, type KeyboardEvent } from 'react';

type PromptInputProps = {
  onSubmit: (prompt: string) => void;
  loading?: boolean;
};

/**
 * Input component for custom design prompt
 * Appears when user clicks the sparkle icon
 */
export default function PromptInput({ onSubmit, loading = false }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim() && !loading) {
      onSubmit(prompt);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
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
        Describe your design:
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., 'Make it more modern with gradient background'"
          disabled={loading}
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: 'inherit',
            resize: 'vertical',
            minHeight: '60px',
            maxHeight: '120px',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || loading}
          style={{
            padding: '8px 16px',
            background: prompt.trim() && !loading ? '#2196F3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: prompt.trim() && !loading ? 'pointer' : 'not-allowed',
            fontSize: '13px',
            fontWeight: 500,
            minWidth: '60px',
            height: '36px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            if (prompt.trim() && !loading) {
              e.currentTarget.style.background = '#1976D2';
            }
          }}
          onMouseLeave={(e) => {
            if (prompt.trim() && !loading) {
              e.currentTarget.style.background = '#2196F3';
            }
          }}
        >
          {loading ? '...' : '→'}
        </button>
      </div>
      <p
        style={{
          fontSize: '11px',
          color: '#999',
          marginTop: '4px',
          marginBottom: 0,
        }}
      >
        Press Enter to submit, Shift+Enter for new line
      </p>
    </div>
  );
}