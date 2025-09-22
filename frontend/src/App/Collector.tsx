//import React from "react";
//This function parses an HTML string and returns an array of HTMLElements
export function Collector(input: string): HTMLElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");
  const elements = Array.from(doc.body.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  );
    
  return elements;
}
