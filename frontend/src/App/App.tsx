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
  const [currentPage, setCurrentPage] = useState(Page.Drawing);
  const drawingRef = useRef<DrawingHandle | null>(null);

  const handleGenerate = async () => {
    // Use the built-in exporter wrapped inside Drawing.
    await drawingRef.current?.exportPNGInNewTab?.();
  };

  return (
    <div className={styles.appRoot}>
      <Navbar
        curPage={currentPage}
        onPageChange={setCurrentPage}
        onGenerate={handleGenerate}
        filename="untitled.sketch"
      />
      <div className={styles.main}>
        {currentPage === Page.Drawing && (
          <Drawing ref={drawingRef} className={styles.canvas} />
        )}
        {currentPage === Page.Mockup && <Mockup />}
      </div>
    </div>
  );
}
