// Mockup.tsx
//This is just for safety purposes. You can remove it if you want. It just detects unsafe HTML code.
import DOMPurify from "dompurify";
import styles from "./App.module.css";

type Props = {
  /** The HTML string returned by the backend (Claude). */
  html?: string;
};

/**
 * Displays the generated HTML/CSS from the backend.
 * We sanitize the string to avoid XSS before injecting it into the DOM.
 */
export default function Mockup({ html = "" }: Props) {
  const safe = DOMPurify.sanitize(html ?? "");

  return (
    <div className={styles.mockup}>
      {!html && <em>No mockup yet. Click “Generate”.</em>}

      {!!html && (
        <iframe
          // Inject sanitized HTML into the preview container
          srcdoc={safe}
        />
      )}
    </div>
  );
}
