/**
 * Multi-page export utilities for generating linked HTML pages
 */

import type { MockupPage } from '../Mockup';
import JSZip from 'jszip';

type PageLinks = {
  [mockupPageId: string]: {
    [elementId: string]: string; // elementId -> targetPageId
  };
};

type MockupStyles = {
  [mockupPageId: string]: {
    [elementId: string]: {
      current: {
        styles: { [property: string]: string };
        html: string | null;
      };
      history: Array<{
        styles: { [property: string]: string };
        html: string | null;
      }>;
      future: Array<{
        styles: { [property: string]: string };
        html: string | null;
      }>;
    };
  };
};

/**
 * Converts a page name to a valid filename/anchor
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Adds unique data-element-id attributes to HTML elements
 * This must match the logic in EditableComponentsToString.tsx
 */
function addUniqueIds(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let idCounter = 0;

  const addIds = (element: Element) => {
    element.setAttribute('data-element-id', `el-${idCounter++}`);
    Array.from(element.children).forEach(addIds);
  };

  Array.from(doc.body.children).forEach(addIds);
  return doc.body.innerHTML;
}

/**
 * Cleans HTML by removing editor-specific classes and attributes
 * Note: This should be called AFTER applyPageLinks since it removes data-element-id
 */
function cleanHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove link badge spans
  doc.querySelectorAll('.page-link-badge').forEach(el => el.remove());

  // Clean all elements
  doc.querySelectorAll('*').forEach(element => {
    // Remove editor-specific classes
    (element as HTMLElement).classList.remove('editable-element', 'selected', 'has-page-link');

    // Remove editor data attributes
    element.removeAttribute('data-element-id');
    element.removeAttribute('data-page-link');
    element.removeAttribute('data-applied-styles');

    // Clean up empty class attributes
    if ((element as HTMLElement).className === '') {
      element.removeAttribute('class');
    }
  });

  // Remove editor scripts
  doc.querySelectorAll('script').forEach(el => el.remove());

  // Remove editor styles
  doc.querySelectorAll('style').forEach(style => {
    const content = style.textContent || '';
    if (content.includes('.editable-element') || content.includes('.page-link-badge')) {
      style.remove();
    }
  });

  return doc.body.innerHTML;
}

/**
 * Applies page links to HTML content
 * For single HTML export: converts links to anchor references (#page-slug)
 * For ZIP export: converts links to file references (page-slug.html)
 */
function applyPageLinks(
  html: string,
  pageId: string,
  pageLinks: PageLinks,
  mockups: MockupPage[],
  useAnchors: boolean
): string {
  const linksForPage = pageLinks[pageId];
  if (!linksForPage || Object.keys(linksForPage).length === 0) return html;

  let result = html;

  // For each linked element, add click handler
  Object.entries(linksForPage).forEach(([elementId, targetPageId]) => {
    const targetPage = mockups.find(m => m.id === targetPageId);
    if (!targetPage) return;

    const targetSlug = slugify(targetPage.name);

    // For single HTML: use showPage function
    // For ZIP: navigate to the file
    const clickHandler = useAnchors
      ? `showPage('${targetSlug}')`
      : `window.location.href='${targetSlug === slugify(mockups[0].name) ? 'index.html' : targetSlug + '.html'}'`;

    // Find the element with this data-element-id and add onclick
    // Match the opening tag with data-element-id attribute
    const elementRegex = new RegExp(
      `(<[^>]*\\sdata-element-id=["']${elementId}["'][^>]*)(>)`,
      'g'
    );

    result = result.replace(elementRegex, (match, tagStart, tagEnd) => {
      // Check if there's already a style attribute
      if (tagStart.includes('style="')) {
        tagStart = tagStart.replace(/style="([^"]*)"/, 'style="$1; cursor: pointer;"');
      } else {
        tagStart = tagStart + ' style="cursor: pointer;"';
      }
      return `${tagStart} onclick="${clickHandler}; return false;"${tagEnd}`;
    });
  });

  return result;
}

/**
 * Extracts body content from a full HTML document
 */
function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
}

/**
 * Applies saved styles and HTML replacements to elements
 * This ensures exported HTML includes all user modifications
 */
function applyMockupStyles(
  html: string,
  pageId: string,
  mockupStyles: MockupStyles
): string {
  const stylesForPage = mockupStyles[pageId];
  if (!stylesForPage || Object.keys(stylesForPage).length === 0) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  Object.entries(stylesForPage).forEach(([elementId, elementData]) => {
    const element = doc.querySelector(`[data-element-id="${elementId}"]`);
    if (!element) return;

    const { current } = elementData;

    // If there's a replacement HTML, use it
    if (current.html !== null) {
      const temp = document.createElement('div');
      temp.innerHTML = current.html;
      const newElement = temp.firstElementChild;
      if (newElement) {
        // Preserve the element ID
        newElement.setAttribute('data-element-id', elementId);
        // Apply any additional styles on top
        Object.entries(current.styles).forEach(([prop, value]) => {
          (newElement as HTMLElement).style.setProperty(prop, value);
        });
        element.replaceWith(newElement);
      }
    } else {
      // Just apply styles
      Object.entries(current.styles).forEach(([prop, value]) => {
        (element as HTMLElement).style.setProperty(prop, value);
      });
    }
  });

  return doc.body.innerHTML;
}

/**
 * Exports all mockup pages as a single HTML file with anchor navigation
 */
export function exportAsSingleHTML(
  mockups: MockupPage[],
  pageLinks: PageLinks,
  mockupStyles: MockupStyles,
  filename: string = 'website.html'
): void {
  if (mockups.length === 0) {
    alert('No mockups to export');
    return;
  }

  // Build page sections
  const pageSections = mockups.map((mockup, index) => {
    const slug = slugify(mockup.name);
    const isFirst = index === 0;

    // Clean the HTML from markdown code blocks
    let content = mockup.html
      .replace(/```html\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    // Extract just the body content
    content = extractBodyContent(content);

    // Add element IDs (must match EditableComponentsToString logic)
    content = addUniqueIds(content);

    // Apply saved styles and variations - must be after addUniqueIds
    content = applyMockupStyles(content, mockup.id, mockupStyles);

    // Apply page links (using anchors) - must be after addUniqueIds
    content = applyPageLinks(content, mockup.id, pageLinks, mockups, true);

    // Clean editor artifacts - must be after applyPageLinks
    content = cleanHtml(content);

    return `
    <!-- Page: ${mockup.name} -->
    <section id="${slug}" class="page-section" ${isFirst ? '' : 'style="display: none;"'}>
      ${content}
    </section>`;
  }).join('\n');

  // Build the complete HTML document
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename.replace('.html', '')}</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    html, body { margin: 0; padding: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }

    /* Page sections */
    .page-section {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  ${pageSections}

  <script>
    function showPage(slug) {
      // Hide all sections
      document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
      });

      // Show selected section
      const target = document.getElementById(slug);
      if (target) {
        target.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  </script>
</body>
</html>`;

  // Download the file
  const blob = new Blob([fullHtml], { type: 'text/html' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Exports all mockup pages as a ZIP file with individual HTML files
 */
export async function exportAsZip(
  mockups: MockupPage[],
  pageLinks: PageLinks,
  mockupStyles: MockupStyles,
  filename: string = 'website.zip'
): Promise<void> {
  if (mockups.length === 0) {
    alert('No mockups to export');
    return;
  }

  const zip = new JSZip();

  // Generate each page
  mockups.forEach((mockup, index) => {
    const slug = slugify(mockup.name);
    const isIndex = index === 0;
    const pageFilename = isIndex ? 'index.html' : `${slug}.html`;

    // Clean the HTML
    let content = mockup.html
      .replace(/```html\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    // Extract body content if it's a full HTML document
    const bodyContent = extractBodyContent(content);

    // Add element IDs (must match EditableComponentsToString logic)
    let processedContent = addUniqueIds(bodyContent);

    // Apply saved styles and variations - must be after addUniqueIds
    processedContent = applyMockupStyles(processedContent, mockup.id, mockupStyles);

    // Apply page links (using file references) - must be after addUniqueIds
    processedContent = applyPageLinks(processedContent, mockup.id, pageLinks, mockups, false);

    // Clean editor artifacts but preserve the full HTML structure
    processedContent = cleanHtml(processedContent);

    // Use the processed content
    content = processedContent;

    // If it's not a full HTML document, wrap it
    if (!content.toLowerCase().includes('<!doctype') && !content.toLowerCase().includes('<html')) {
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${mockup.name}</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    html, body { margin: 0; padding: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
    }
    // If it already has DOCTYPE/html structure, use it as-is

    zip.file(pageFilename, content);
  });

  // Generate and download the ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
