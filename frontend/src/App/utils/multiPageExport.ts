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
  return html
    // Clean up class attributes - remove editor classes but keep others
    .replace(/\sclass="([^"]*)"/g, (match, classes) => {
      const cleaned = classes
        .replace(/\beditable-element\b/g, '')
        .replace(/\bselected\b/g, '')
        .replace(/\bhas-page-link\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!cleaned) return '';
      return ` class="${cleaned}"`;
    })
    // Remove editor data attributes
    .replace(/\s*data-element-id="[^"]*"/g, '')
    .replace(/\s*data-page-link="[^"]*"/g, '')
    // Remove link badges
    .replace(/<span[^>]*class="[^"]*page-link-badge[^"]*"[^>]*>.*?<\/span>/gi, '')
    // Remove editor scripts (but keep our onclick handlers)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove editor styles
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, (match) => {
      if (match.includes('.editable-element') || match.includes('.page-link-badge')) {
        return '';
      }
      return match;
    });
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
 * Exports all mockup pages as a single HTML file with anchor navigation
 */
export function exportAsSingleHTML(
  mockups: MockupPage[],
  pageLinks: PageLinks,
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

  // Build navigation
  const navItems = mockups.map((mockup, index) => {
    const slug = slugify(mockup.name);
    return `<button class="nav-btn${index === 0 ? ' active' : ''}" onclick="showPage('${slug}')">${mockup.name}</button>`;
  }).join('\n        ');

  // Build the complete HTML document
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename.replace('.html', '')}</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }

    /* Navigation */
    .page-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #1f2937;
      padding: 12px 24px;
      display: flex;
      gap: 8px;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .nav-btn {
      background: #374151;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    .nav-btn:hover { background: #4b5563; }
    .nav-btn.active { background: #6366f1; }

    /* Page sections */
    .page-section {
      min-height: 100vh;
      padding-top: 60px; /* Account for fixed nav */
    }
  </style>
</head>
<body>
  <!-- Navigation Bar -->
  <nav class="page-nav">
    ${navItems}
  </nav>

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

      // Update nav buttons - remove active from all, add to matching one
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        const onclickStr = btn.getAttribute('onclick') || '';
        if (onclickStr.includes("'" + slug + "'")) {
          btn.classList.add('active');
        }
      });
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

    // Apply page links (using file references) - must be after addUniqueIds
    processedContent = applyPageLinks(processedContent, mockup.id, pageLinks, mockups, false);

    // Clean editor artifacts but preserve the full HTML structure
    processedContent = cleanHtml(processedContent);

    // Use the processed content
    content = processedContent;

    // If it's not a full HTML document, wrap it
    if (!content.toLowerCase().includes('<!doctype') && !content.toLowerCase().includes('<html')) {
      // Build navigation for this page
      const navItems = mockups.map((m, i) => {
        const mSlug = slugify(m.name);
        const href = i === 0 ? 'index.html' : `${mSlug}.html`;
        const isActive = m.id === mockup.id;
        return `<a href="${href}" class="nav-link${isActive ? ' active' : ''}">${m.name}</a>`;
      }).join('\n          ');

      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${mockup.name}</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }

    /* Navigation */
    .page-nav {
      background: #1f2937;
      padding: 12px 24px;
      display: flex;
      gap: 8px;
    }
    .nav-link {
      background: #374151;
      color: white;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      transition: background 0.2s;
    }
    .nav-link:hover { background: #4b5563; }
    .nav-link.active { background: #6366f1; }
  </style>
</head>
<body>
  <!-- Navigation Bar -->
  <nav class="page-nav">
    ${navItems}
  </nav>

  <!-- Page Content -->
  <main>
    ${content}
  </main>
</body>
</html>`;
    } else {
      // Inject navigation into existing HTML structure
      const navHtml = `
  <nav class="page-nav" style="background: #1f2937; padding: 12px 24px; display: flex; gap: 8px;">
    ${mockups.map((m, i) => {
      const mSlug = slugify(m.name);
      const href = i === 0 ? 'index.html' : `${mSlug}.html`;
      const isActive = m.id === mockup.id;
      return `<a href="${href}" style="background: ${isActive ? '#6366f1' : '#374151'}; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px;">${m.name}</a>`;
    }).join('\n    ')}
  </nav>`;

      // Insert nav after <body> tag
      content = content.replace(/<body([^>]*)>/i, `<body$1>\n${navHtml}`);
    }

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
