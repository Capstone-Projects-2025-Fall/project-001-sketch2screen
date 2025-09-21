// Mockup.tsx
//This is just for safety purposes. You can remove it if you want. It just detects unsafe HTML code.
import DOMPurify from "dompurify";

// Props: expects an optional HTML string (the code returned by backend)
export default function Mockup({ html = "" }: { html?: string }) {
  // Always sanitize HTML before injecting into the DOM
  const safe = DOMPurify.sanitize(html ?? "");

  return (
    <div style={{ padding: 16 }}>
      {/* If no HTML has been generated yet, show a placeholder */}
      {!html && <em>No mockup yet. Click “Generate”.</em>}

      {/* If HTML is present, render it inside a styled container */}
      {!!html && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            background: "#fff",
          }}
          // 👇 This injects the sanitized HTML string into the DOM
          // Without sanitization, this would be a major XSS risk.
          dangerouslySetInnerHTML={{ __html: safe }}
        />
      )}
    </div>
  );
}

