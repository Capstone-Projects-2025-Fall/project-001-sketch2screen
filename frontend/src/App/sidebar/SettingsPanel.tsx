import { useEffect, useState, useRef } from 'react';
import styles from '../App.module.css';

type PageInfo = {
  id: string;
  name: string;
};

type SettingsPanelProps = {
  selectedElement: {
    id: string;
    html: string;
    type: string;
  } | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onStyleChange?: (elementId: string, property: string, value: string) => void;
  /** Handler for attribute changes (e.g., image src) */
  onAttributeChange?: (elementId: string, attribute: string, value: string) => void;
  /** Available pages for linking */
  availablePages?: PageInfo[];
  /** Current page link for the selected element */
  currentPageLink?: string | null;
  /** Handler for page link changes */
  onPageLinkChange?: (elementId: string, targetPageId: string | null) => void;
};

type StyleValues = {
  width: string;
  height: string;
  backgroundColor: string;
  color: string;
  fontSize: string;
  padding: string;
  margin: string;
  borderRadius: string;
};

export default function SettingsPanel({ selectedElement, iframeRef, onStyleChange, onAttributeChange, availablePages = [], currentPageLink, onPageLinkChange }: SettingsPanelProps) {
  const [styleValues, setStyleValues] = useState<StyleValues>({
    width: '',
    height: '',
    backgroundColor: '',
    color: '',
    fontSize: '',
    padding: '',
    margin: '',
    borderRadius: '',
  });

  const [textContent, setTextContent] = useState('');
  const textDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [imageSrc, setImageSrc] = useState('');
  const imageSrcDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Convert RGB to HEX
  const rgbToHex = (rgb: string): string => {
    if (!rgb || rgb.startsWith('#')) return rgb || '#000000';
    const matches = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!matches) return '#000000';
    const r = parseInt(matches[1]).toString(16).padStart(2, '0');
    const g = parseInt(matches[2]).toString(16).padStart(2, '0');
    const b = parseInt(matches[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  };

  // Request styles from iframe when element changes
  useEffect(() => {
    if (selectedElement && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'GET_ELEMENT_STYLES',
        elementId: selectedElement.id,
      }, '*');

      if (['p', 'h1', 'h2', 'h3', 'span', 'button', 'a'].includes(selectedElement.type)) {
        iframeRef.current.contentWindow.postMessage({
          type: 'GET_ELEMENT_CONTENT',
          elementId: selectedElement.id,
        }, '*');
      }

      if (selectedElement.type === 'img') {
        iframeRef.current.contentWindow.postMessage({
          type: 'GET_ELEMENT_ATTRIBUTE',
          elementId: selectedElement.id,
          attribute: 'src'
        }, '*');
      }

    }
  }, [selectedElement, iframeRef]);

  // Listen for style updates from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_STYLES') {
        const computedStyles = event.data.styles;
        setStyleValues({
          width: computedStyles.width || '',
          height: computedStyles.height || '',
          backgroundColor: rgbToHex(computedStyles.backgroundColor) || '',
          color: rgbToHex(computedStyles.color) || '',
          fontSize: computedStyles.fontSize || '',
          padding: computedStyles.padding || '',
          margin: computedStyles.margin || '',
          borderRadius: computedStyles.borderRadius || '',
        });
      }
      if (event.data.type === 'ELEMENT_CONTENT') {
        setTextContent(event.data.content || '');
      }

      if (event.data.type === 'ELEMENT_ATTRIBUTE' && event.data.attribute === 'src') 
      {
        setImageSrc(event.data.value || '');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle style changes with debouncing
  const handleStyleChange = (property: keyof StyleValues, value: string) => {
    setStyleValues(prev => ({ ...prev, [property]: value }));

    if (debounceTimers.current[property]) {
      clearTimeout(debounceTimers.current[property]);
    }

    debounceTimers.current[property] = setTimeout(() => {
      if (selectedElement){
        onStyleChange?.(selectedElement.id, property, value);
      }
    }, 300);
  };

  const handleTextChange = (newText: string) => {
    setTextContent(newText);

    if (textDebounceTimer.current) {
      clearTimeout(textDebounceTimer.current);
    }

    textDebounceTimer.current = setTimeout(() => {
      if (selectedElement && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'UPDATE_ELEMENT_CONTENT',
          elementId: selectedElement.id,
          content: newText,
        }, '*');
      }
    }, 300);
  };

  const handleImageSrcChange = (newSrc: string) => {
    setImageSrc(newSrc);

    if (imageSrcDebounceTimer.current) {
      clearTimeout(imageSrcDebounceTimer.current);
    }

    imageSrcDebounceTimer.current = setTimeout(() => {
      if (selectedElement) {
        // Use onAttributeChange to store the change and send to iframe
        if (onAttributeChange) {
          onAttributeChange(selectedElement.id, 'src', newSrc);
        } else if (iframeRef.current?.contentWindow) {
          // Fallback: send directly to iframe if no handler provided
          iframeRef.current.contentWindow.postMessage({
            type: 'UPDATE_ELEMENT_ATTRIBUTE',
            elementId: selectedElement.id,
            attribute: 'src',
            value: newSrc,
          }, '*');
        }
      }
    }, 300);
  };



  if (!selectedElement) {
    return (
      <div className={styles.emptyState}>
        <p>Select an element to edit its styles</p>
      </div>
    );
  }

  return (
    <div className={styles.settingsTabContent}>
      <div className={styles.settingsGroup}>
        <label>Element ID:</label>
        <code className={styles.elementIdDisplay}>{selectedElement.id}</code>
      </div>

      <div className={styles.settingsGroup}>
        <label>Width:</label>
        <input
          type="text"
          value={styleValues.width}
          onChange={(e) => handleStyleChange('width', e.target.value)}
          placeholder="e.g., 100px, 50%"
        />
      </div>

      <div className={styles.settingsGroup}>
        <label>Height:</label>
        <input
          type="text"
          value={styleValues.height}
          onChange={(e) => handleStyleChange('height', e.target.value)}
          placeholder="e.g., 100px"
        />
      </div>

      <div className={styles.settingsGroup}>
        <label>Background Color:</label>
        <div className={styles.colorInputGroup}>
          <input
            type="color"
            value={styleValues.backgroundColor}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
          />
          <input
            type="text"
            value={styleValues.backgroundColor}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            placeholder="#ffffff"
          />
        </div>
      </div>

      <div className={styles.settingsGroup}>
        <label>Text Color:</label>
        <div className={styles.colorInputGroup}>
          <input
            type="color"
            value={styleValues.color}
            onChange={(e) => handleStyleChange('color', e.target.value)}
          />
          <input
            type="text"
            value={styleValues.color}
            onChange={(e) => handleStyleChange('color', e.target.value)}
            placeholder="#000000"
          />
        </div>
      </div>

      <div className={styles.settingsGroup}>
        <label>Font Size:</label>
        <input
          type="text"
          value={styleValues.fontSize}
          onChange={(e) => handleStyleChange('fontSize', e.target.value)}
          placeholder="e.g., 16px"
        />
      </div>

      {['p', 'h1', 'h2', 'h3', 'span', 'button', 'a'].includes(selectedElement.type) && (
        <div className={styles.settingsGroup}>
          <label>Text Content:</label>
          <input
            value={textContent}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Edit text content..."
          />
        </div>
      )}

      <div className={styles.settingsGroup}>
        <label>Padding:</label>
        <input
          type="text"
          value={styleValues.padding}
          onChange={(e) => handleStyleChange('padding', e.target.value)}
          placeholder="e.g., 10px"
        />
      </div>

      <div className={styles.settingsGroup}>
        <label>Margin:</label>
        <input
          type="text"
          value={styleValues.margin}
          onChange={(e) => handleStyleChange('margin', e.target.value)}
          placeholder="e.g., 10px"
        />
      </div>

      <div className={styles.settingsGroup}>
        <label>Border Radius:</label>
        <input
          type="text"
          value={styleValues.borderRadius}
          onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
          placeholder="e.g., 4px"
        />
      </div>

      {selectedElement.type === 'img' && (
        <div className={styles.settingsGroup}>
          <label>Image Source Link:</label>
          <input
            type="text"
            value={imageSrc}
            onChange={(e) => handleImageSrcChange(e.target.value)}
            placeholder="https://example.com/image.png"
          />
        </div>
      )}

      {/* Page Link Section */}
      {availablePages.length > 0 && (
        <div className={styles.settingsGroup}>
          <label className={styles.pageLinkLabel}>
            Link to Page:
            {currentPageLink && <span className={styles.linkIndicator}>🔗</span>}
          </label>
          <select
            className={styles.pageLinkSelect}
            value={currentPageLink || ''}
            onChange={(e) => {
              if (selectedElement && onPageLinkChange) {
                onPageLinkChange(selectedElement.id, e.target.value || null);
              }
            }}
          >
            <option value="">None (no link)</option>
            {availablePages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name}
              </option>
            ))}
          </select>
          {currentPageLink && (
            <p className={styles.linkHint}>
              This element will navigate to "{availablePages.find(p => p.id === currentPageLink)?.name}" on click
            </p>
          )}
        </div>
      )}

    </div>
  );
}