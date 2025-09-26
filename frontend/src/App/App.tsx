import styles from "./App.module.css";
import { useRef, useState } from "react";

import Navbar from "./Navbar";
import type { DrawingHandle } from "./Drawing";
import Mockup from "./Mockup";
import Drawing from "./Drawing";

export enum Page {
  Drawing,
  Mockup
}

export default function App() {
  //Represents which pagte is currently shown.
  const [currentPage, setCurrentPage] = useState(Page.Drawing);

  //Reference to the Drawing component.
  const drawingRef = useRef<DrawingHandle | null>(null);

  //Holds the HTML returned by the backend so we can render it on the Design page
  const [html, setHtml] = useState<string>("");

  //Use state for when user wants to change the filename
  const [filename, setFilename] = useState<string>("");

  //Called when user clicks the "Generate" button in the Navbar.
  const handleGenerate = async () => {
    const blob = await drawingRef.current?.getPNGBlob?.();
    if (!blob) {
      alert("Please create a sketch first. No sketch to export");
      return;
    }
    //form data to send to backend
    const sketch = new FormData();
    sketch.append("file", new File([blob], "sketch.png", { type: "image/png" }));

    const res = await fetch("/api/generate/", {
      method: "POST",
      body: sketch,
    });

    if (!res.ok) {
      alert("Failed to generate HTML from sketch");
      return;
    }

    //Export JSON back from the server
    const data = (await res.json()) as {html?: string};
    const htmlStr = (data.html ?? "").trim();
    if (!htmlStr) {
      alert("No HTML received from server");
      return;
    }
    //Save HTML
    setHtml(htmlStr);

    //Here you can set the current page to Mockup if you want to switch automatically
    setCurrentPage(Page.Mockup); 

  }

  return (
    <div className={styles.appRoot}>
      <Navbar
        curPage={currentPage}
        onPageChange={setCurrentPage}
        onGenerate={handleGenerate}
        filename={filename}
        onFilenameChange={setFilename}
      />
      <div className={styles.main}>
        <Drawing 
          ref={drawingRef} 
          className={styles.canvas} 
          visible={currentPage === Page.Drawing}
        />
        {currentPage === Page.Mockup && <Mockup html = {html} />}
      </div>
    </div>
  );
}
