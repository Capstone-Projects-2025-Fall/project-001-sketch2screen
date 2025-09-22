// Mockup.tsx
//This is just for safety purposes. You can remove it if you want. It just detects unsafe HTML code.
import DOMPurify from "dompurify";

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
    <div style={{ padding: 16 }}>
      {!html && <em>No mockup yet. Click “Generate”.</em>}

      {!!html && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            background: "#fff",
            overflow: "auto",
            minHeight: 200,
          }}
          // Inject sanitized HTML into the preview container
          dangerouslySetInnerHTML={{ __html: safe }}
        />
      )}
    </div>
  );
}
