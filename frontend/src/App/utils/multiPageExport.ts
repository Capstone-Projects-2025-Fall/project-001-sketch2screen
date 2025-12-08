/**
 * Multi-page export utilities for generating linked HTML pages
 * Uses hidden iframes to render pages with Tailwind CSS and extract compiled styles
 */

import type { MockupPage } from '../Mockup';
import { OutputPage } from '../setting/OutputPage';
import DOMPurify from 'dompurify';
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
        attributes?: { [attribute: string]: string };
      };
      history: Array<{
        styles: { [property: string]: string };
        html: string | null;
        attributes?: { [attribute: string]: string };
      }>;
      future: Array<{
        styles: { [property: string]: string };
        html: string | null;
        attributes?: { [attribute: string]: string };
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
 * Cleans extracted HTML by removing editor-specific classes and attributes
 * Note: Does NOT remove data-element-id - that's done later by addPageLinkHandlers
 * after it uses those IDs to add click handlers
 */
function cleanExtractedHtml(doc: Document): void {
  // Remove link badge spans
  doc.querySelectorAll('.page-link-badge').forEach(el => el.remove());

  // Remove scripts
  doc.querySelectorAll('script').forEach(el => el.remove());

  // Remove editor styles (keep Tailwind styles)
  doc.querySelectorAll('style').forEach(style => {
    const content = style.textContent || '';
    if (content.includes('.editable-element') || content.includes('#settings-panel') || content.includes('.page-link-badge')) {
      style.remove();
    }
  });

  // Clean all elements - but keep data-element-id for page link processing
  doc.querySelectorAll('*').forEach(element => {
    // Remove editor-specific classes
    (element as HTMLElement).classList.remove('editable-element', 'selected', 'has-page-link');

    // Remove some editor data attributes (but NOT data-element-id yet)
    element.removeAttribute('data-page-link');
    element.removeAttribute('data-applied-styles');

    // Clean up empty class attributes
    if ((element as HTMLElement).className === '') {
      element.removeAttribute('class');
    }
  });
}

/**
 * Renders a mockup page in a hidden iframe and extracts the compiled HTML
 * This captures all Tailwind CSS styles that have been compiled by the browser runtime
 */
function renderPageInIframe(
  mockup: MockupPage,
  mockupStyles: MockupStyles,
  pageLinks: PageLinks
): Promise<{ headContent: string; bodyContent: string }> {
  return new Promise((resolve, reject) => {
    // Clean HTML from markdown code blocks
    const cleanedHtml = mockup.html
      .replace(/```html\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    // Sanitize
    const safeHtml = DOMPurify.sanitize(cleanedHtml, {
      WHOLE_DOCUMENT: true,
      FORCE_BODY: false,
      ADD_TAGS: ['link', 'script'],
      ADD_ATTR: ['target']
    });

    // Generate iframe content using the same function as the editor
    const iframeContent = OutputPage(safeHtml);

    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 1200px; height: 800px; visibility: hidden;';
    iframe.sandbox.add('allow-same-origin', 'allow-scripts');
    document.body.appendChild(iframe);

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        document.body.removeChild(iframe);
        reject(new Error(`Timeout rendering page: ${mockup.name}`));
      }
    }, 10000); // 10 second timeout

    // Listen for iframe loaded message
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'IFRAME_LOADED' && !resolved) {
        // Apply saved styles, HTML variations, and attributes
        const stylesForPage = mockupStyles[mockup.id];
        if (stylesForPage && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'INJECT_STYLES',
            styles: Object.fromEntries(
              Object.entries(stylesForPage).map(([elementId, data]) => [
                elementId,
                data.current.styles
              ])
            )
          }, '*');

          // Apply HTML variations
          Object.entries(stylesForPage).forEach(([elementId, data]) => {
            if (data.current.html !== null) {
              iframe.contentWindow!.postMessage({
                type: 'APPLY_VARIATION',
                elementId,
                newHtml: data.current.html,
              }, '*');
            }
          });

          // Apply attributes (e.g., image src)
          Object.entries(stylesForPage).forEach(([elementId, data]) => {
            if (data.current.attributes) {
              Object.entries(data.current.attributes).forEach(([attribute, value]) => {
                iframe.contentWindow!.postMessage({
                  type: 'UPDATE_ELEMENT_ATTRIBUTE',
                  elementId,
                  attribute,
                  value,
                }, '*');
              });
            }
          });
        }

        // Apply page links visual indicators
        const linksForPage = pageLinks[mockup.id];
        if (linksForPage && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'INJECT_PAGE_LINKS',
            links: linksForPage,
          }, '*');
        }

        // Wait a bit for styles to apply and Tailwind to finish processing
        setTimeout(() => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);

          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) {
              document.body.removeChild(iframe);
              reject(new Error('Cannot access iframe document'));
              return;
            }

            // Clone the document to avoid modifying the original
            const clonedDoc = iframeDoc.documentElement.cloneNode(true) as HTMLElement;
            const parser = new DOMParser();
            const doc = parser.parseFromString(clonedDoc.outerHTML, 'text/html');

            // Clean editor artifacts
            cleanExtractedHtml(doc);

            // Extract only <style> tags from head (not meta tags)
            const styleTags = Array.from(doc.head.querySelectorAll('style'));
            const styleContent = styleTags.map(s => s.outerHTML).join('\n');

            // Extract body content
            const bodyContent = doc.body.innerHTML;

            document.body.removeChild(iframe);
            resolve({ headContent: styleContent, bodyContent });
          } catch (error) {
            document.body.removeChild(iframe);
            reject(error);
          }
        }, 500); // Give Tailwind time to process
      }
    };

    window.addEventListener('message', handleMessage);

    // Load content into iframe
    iframe.srcdoc = iframeContent;
  });
}

/**
 * Adds page link click handlers to the body content and cleans up data-element-id attributes
 */
function addPageLinkHandlers(
  bodyContent: string,
  pageId: string,
  pageLinks: PageLinks,
  mockups: MockupPage[],
  useAnchors: boolean
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${bodyContent}</body>`, 'text/html');

  // Add click handlers for linked elements
  const linksForPage = pageLinks[pageId];
  if (linksForPage && Object.keys(linksForPage).length > 0) {
    Object.entries(linksForPage).forEach(([elementId, targetPageId]) => {
      const targetPage = mockups.find(m => m.id === targetPageId);
      if (!targetPage) return;

      const targetSlug = slugify(targetPage.name);
      const element = doc.querySelector(`[data-element-id="${elementId}"]`);

      if (element) {
        // Add click handler
        const clickHandler = useAnchors
          ? `showPage('${targetSlug}')`
          : `window.location.href='${targetSlug === slugify(mockups[0].name) ? 'index.html' : targetSlug + '.html'}'`;

        element.setAttribute('onclick', `${clickHandler}; return false;`);
        (element as HTMLElement).style.cursor = 'pointer';
      }
    });
  }

  // Always clean up ALL data-element-id attributes from all elements
  doc.querySelectorAll('[data-element-id]').forEach(el => {
    el.removeAttribute('data-element-id');
  });

  return doc.body.innerHTML;
}

/**
 * Exports all mockup pages as a single HTML file with anchor navigation
 * Uses hidden iframes to render pages with compiled Tailwind CSS
 */
export async function exportAsSingleHTML(
  mockups: MockupPage[],
  pageLinks: PageLinks,
  mockupStyles: MockupStyles,
  filename: string = 'website.html'
): Promise<void> {
  if (mockups.length === 0) {
    alert('No mockups to export');
    return;
  }

  try {
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'export-loading';
    loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px 40px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 10000; font-family: system-ui;';
    loadingDiv.textContent = 'Exporting pages...';
    document.body.appendChild(loadingDiv);

    // Render all pages
    const renderedPages: Array<{ slug: string; name: string; headContent: string; bodyContent: string }> = [];

    for (let i = 0; i < mockups.length; i++) {
      const mockup = mockups[i];
      loadingDiv.textContent = `Rendering page ${i + 1} of ${mockups.length}...`;

      const { headContent, bodyContent } = await renderPageInIframe(mockup, mockupStyles, pageLinks);
      const slug = slugify(mockup.name);

      // Add page link handlers before cleaning element IDs
      const bodyWithLinks = addPageLinkHandlers(
        bodyContent,
        mockup.id,
        pageLinks,
        mockups,
        true // use anchors for single HTML
      );

      renderedPages.push({
        slug,
        name: mockup.name,
        headContent,
        bodyContent: bodyWithLinks,
      });
    }

    // Combine all Tailwind CSS from all pages
    // Each page may have different classes that compile to different CSS rules
    // We need to merge them all so all pages have the styles they need
    const allCssRules = new Set<string>();
    renderedPages.forEach(page => {
      if (page.headContent) {
        // Extract the CSS content from style tags
        const styleMatches = page.headContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        if (styleMatches) {
          styleMatches.forEach(styleTag => {
            // Extract just the CSS content
            const cssContent = styleTag.replace(/<style[^>]*>/i, '').replace(/<\/style>/i, '').trim();
            if (cssContent) {
              allCssRules.add(cssContent);
            }
          });
        }
      }
    });
    // Combine all unique CSS into a single style tag
    const tailwindStyles = allCssRules.size > 0
      ? `<style>${Array.from(allCssRules).join('\n')}</style>`
      : '';

    // Build page sections
    const pageSections = renderedPages.map((page, index) => {
      const isFirst = index === 0;
      return `
    <!-- Page: ${page.name} -->
    <section id="${page.slug}" class="page-section" ${isFirst ? '' : 'style="display: none;"'}>
      ${page.bodyContent}
    </section>`;
    }).join('\n');

    // Build the complete HTML document
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename.replace('.html', '')}</title>
  ${tailwindStyles}
  <style>
    /* Ensure full height for flex layouts */
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    /* Page sections - flex container for proper child layout */
    .page-section {
      min-height: 100vh;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    /* Direct children should be able to use full height */
    .page-section > * {
      flex: 1;
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
        target.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  </script>
</body>
</html>`;

    // Remove loading indicator
    document.body.removeChild(loadingDiv);

    // Download the file
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    // Remove loading indicator if present
    const loadingDiv = document.getElementById('export-loading');
    if (loadingDiv) document.body.removeChild(loadingDiv);

    console.error('Export failed:', error);
    alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Exports all mockup pages as a ZIP file with individual HTML files
 * Uses hidden iframes to render pages with compiled Tailwind CSS
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

  try {
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'export-loading';
    loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px 40px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 10000; font-family: system-ui;';
    loadingDiv.textContent = 'Exporting pages...';
    document.body.appendChild(loadingDiv);

    const zip = new JSZip();

    // Render and add each page to the ZIP
    for (let i = 0; i < mockups.length; i++) {
      const mockup = mockups[i];
      loadingDiv.textContent = `Rendering page ${i + 1} of ${mockups.length}...`;

      const { headContent, bodyContent } = await renderPageInIframe(mockup, mockupStyles, pageLinks);

      const slug = slugify(mockup.name);
      const isIndex = i === 0;
      const pageFilename = isIndex ? 'index.html' : `${slug}.html`;

      // Add page link handlers
      const bodyWithLinks = addPageLinkHandlers(
        bodyContent,
        mockup.id,
        pageLinks,
        mockups,
        false // use file links for ZIP
      );

      // Build the complete HTML document for this page
      const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${mockup.name}</title>
  ${headContent}
</head>
<body>
  ${bodyWithLinks}
</body>
</html>`;

      zip.file(pageFilename, pageHtml);
    }

    // Remove loading indicator
    document.body.removeChild(loadingDiv);

    // Generate and download the ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    // Remove loading indicator if present
    const loadingDiv = document.getElementById('export-loading');
    if (loadingDiv) document.body.removeChild(loadingDiv);

    console.error('Export failed:', error);
    alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
