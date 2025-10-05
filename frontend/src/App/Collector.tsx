//import React from "react";
/**
 * Parses HTML string into an array of DOM elements
 * @param input - Raw HTML string to parse
 * @returns Array of HTMLElement objects extracted from the parsed document body
 * 
 * @example
 * ```ts
 * const html = "<div>Hello</div><p>World</p>";
 * const elements = Collector(html);
 * // Returns [HTMLDivElement, HTMLParagraphElement]
 * ```
 */
export function Collector(input: string): HTMLElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");
  const elements = Array.from(doc.body.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  );
    
  return elements;
}
