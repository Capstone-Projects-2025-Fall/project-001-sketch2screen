import { useState, useRef, useEffect } from "react";
import {Page} from "./App.tsx"
import styles from "./App.module.css"

/** Props for the Navbar component */
type Props = {
  /** Current active page */
  curPage: Page;
  /** Callback for page change events */
  onPageChange: (p: Page) => void;
  /** Current filename being edited */
  filename?: string;
  /** Callback for filename change events */
  onFilenameChange?: (name: string) => void;
  /** Callback to initiate collaboration */
  onStartCollab?: () => void;
  /** Callback to generate mockup */
  onGenerate?: () => void;
  /** Callback to export single page */
  onExport?: () => void;
  /** Callback to export all pages as single HTML */
  onExportSingleHTML?: () => void;
  /** Callback to export all pages as ZIP */
  onExportZip?: () => void;
};

/**
 * Navigation bar component with page switching and actions
 * @param props - Component properties
 * @param props.curPage - Currently active page
 * @param props.onPageChange - Handler for page switches
 * @param props.filename - Current file name (defaults to "untitled.sketch")
 * @param props.onFilenameChange - Handler for filename changes
 * @param props.onStartCollab - Handler for collaboration button
 * @param props.onGenerate - Handler for generate button
 * @returns JSX element containing the navigation bar
 * 
 * @example
 * ```tsx
 * <Navbar 
 *   curPage={Page.Drawing}
 *   onPageChange={setCurrentPage}
 *   filename="my-sketch.sketch"
 *   onFilenameChange={handleNameChange}
 * />
 * ```
 */
export default function Navbar({
  curPage,
  onPageChange,
  filename = "untitled.sketch",
  onFilenameChange,
  onStartCollab,
  onGenerate,
  onExport,
  onExportSingleHTML,
  onExportZip
}: Props) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  /** Handles changes to the filename input */
  const handleNameInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onFilenameChange?.(e.target.value);
  };

  /** Handles Enter key in filename input to blur the field */
  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return<div className={styles.navbar}>
    <div className={styles.logo}>
      Sketch2Screen
    </div>
    <div className={styles.filename}>
       <input
        value={filename}
        onChange={handleNameInput}
        onKeyDown={handleKeyDown}
        aria-label="Filename"
        placeholder="Name of sketch here"
        spellCheck={false}
        />
    </div>
    <div className={styles.pageSwitcher}>
      <button
        className={styles.pageSwitchButton + " " + (curPage===Page.Drawing && styles.pageSwitchSelected)}
        onClick={()=>onPageChange(Page.Drawing)}
      >
        Sketch
      </button>
      <button
        className={styles.pageSwitchButton + " " + (curPage===Page.Mockup && styles.pageSwitchSelected)}
        onClick={()=>onPageChange(Page.Mockup)}
      >
        Design
      </button>
    </div>
    <div className={styles.collabButtonPair}>
      <button className={styles.collabButton} onClick={onStartCollab}>
        Collaborate
      </button>
      {curPage === Page.Mockup ? (
        <div className={styles.exportDropdownContainer} ref={exportMenuRef}>
          <button
            className={styles.generateButton}
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            Export ▾
          </button>
          {showExportMenu && (
            <div className={styles.exportDropdownMenu}>
              <button
                className={styles.exportDropdownItem}
                onClick={() => { onExport?.(); setShowExportMenu(false); }}
              >
                Current Page
              </button>
              <button
                className={styles.exportDropdownItem}
                onClick={() => { onExportSingleHTML?.(); setShowExportMenu(false); }}
              >
                All Pages (Single HTML)
              </button>
              <button
                className={styles.exportDropdownItem}
                onClick={() => { onExportZip?.(); setShowExportMenu(false); }}
              >
                All Pages (ZIP)
              </button>
            </div>
          )}
        </div>
      ) : (
        <button className={styles.generateButton} onClick={onGenerate}>
          Generate
        </button>
      )}
    </div>
  </div>
}
