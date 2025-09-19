import React from "react";
import { Collector } from "./Collector";

export default function Mockup() {
  //This is the sample HTML string to be parsed
  const htmlString = `
    <div>Hello World</div>
    <button>Click Me</button>
    <p>This is a paragraph.</p>
  `;
  //Use the Collector function to parse the HTML string
  const elements = Collector(htmlString);

  return (
    <div>
      {elements.map((el, index) => {
        const Tag = el.tagName.toLowerCase();
        return React.createElement(Tag, { key: index }, el.textContent);
      })}
    </div>
  );
}
