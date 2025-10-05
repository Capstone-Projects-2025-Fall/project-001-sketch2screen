// Mockup.tsx
//This is just for safety purposes. You can remove it if you want. It just detects unsafe HTML code.
import DOMPurify from "dompurify";
import styles from "./App.module.css";

/** Props for the Mockup component */
type Props = {
  /** The HTML string returned by the backend (Claude) */
  html?: string;
};

/**
 * Displays the generated HTML/CSS mockup from the backend
 * @param props - Component properties
 * @param props.html - HTML string to render (sanitized before display)
 * @returns JSX element containing the mockup preview
 *
 * @example
 * ```tsx
 * <Mockup html="<div>Generated content</div>" />
 * ```
 *
 * @security
 * Uses DOMPurify to sanitize HTML and prevent XSS attacks
 */
export default function Mockup({ html = "" }: Props) {
  /** Sanitized version of the input HTML */
  const safe = DOMPurify.sanitize(html ?? "");

  return (
    <div className={styles.mockup}>
      {!html && <em>No mockup yet. Click "Generate".</em>}

      {!!html && (
        <iframe
          srcDoc={safe}
          className={styles.preview}
          title="Generated mockup preview"
        />
      )}
    </div>
  );
}
