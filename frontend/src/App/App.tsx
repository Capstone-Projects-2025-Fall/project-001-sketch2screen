import styles from "./App.module.css"

import {useRef,useState} from "react"

import Navbar from "./Navbar"
import Drawing, { DrawingHandle } from "./Drawing";
import Mockup from "./Mockup"

export enum Page {
  Drawing,
  Mockup
}

export default function App() {
  let [currentPage, setCurrentPage] = useState(Page.Drawing)
  const drawingRef = useRef<DrawingHandle | null>(null);
  
  const handleGenerate = () => {
    // 1) Open the tab
    const w = window.open("", "_blank");
    if (!w) return; 

    // 2) Get the data URL from the Drawing ref
    const dataUrl = drawingRef.current?.getPNGDataURL();

    // 3) Populate the new tab with the PNG (fit to viewport)
    w.document.title = "Sketch Preview";
    w.document.body.style.margin = "0";
    w.document.body.innerHTML = `
      <img src="${dataUrl}"
           style="display:block;max-width:100vw;max-height:100vh;object-fit:contain;margin:0 auto;" />
    `;
  };

  return <>
      <Navbar
        curPage={currentPage}
        onPageChange={setCurrentPage}
        onGenerate={handleGenerate}
        filename="untitled.sketch"
      />
      {currentPage === Page.Drawing && (
        <Drawing ref={drawingRef} className={styles.canvas} />
      )}
      {currentPage === Page.Mockup && <Mockup />}
  </>
}
