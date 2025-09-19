import {Page} from "./App.tsx"
//import React from "react";
import styles from "./App.module.css"

type Props = {
  curPage: Page;
  onPageChange: (p: Page) => void;
  filename?: string;
  onStartCollab?: () => void;
  onGenerate?: () => void; // new prop
};

export default function Navbar({curPage, onPageChange, filename = "untitled.sketch", onStartCollab, onGenerate} : Props) {
  /*
  const btn = (selected: boolean) =>
    [styles.pageSwitchButton, selected ? styles.pageSwitchSelected : ""]
      .filter(Boolean)
      .join(" ");
      */
  return<div className={styles.navbar}>
    <div className={styles.logo}>
      Sketch2Screen
    </div>
    <div className={styles.filename}>
      {filename}
    </div>
    <div className={styles.pageSwitcher}>
      <button 
        className={styles.pageSwitchButton + " " + (curPage===Page.Drawing && styles.pageSwitchSelected)}
        onClick={()=>onPageChange(Page.Drawing)}
      >
        Sketch
      </button>
      <button
        className={styles.pageSwitchButton + " " + (curPage===Page.Mockup && styles.pageSwitchSelected)}
        onClick={()=>onPageChange(Page.Mockup)}
      >
        Design
      </button>
    </div>
    <div className={styles.collabButtonPair}>
      <button className={styles.collabButton} onClick={onStartCollab}>
        Collaborate
      </button>
      <button className={styles.collabButton} onClick={onGenerate}>
        Generate
      </button>
    </div>
  </div>
}
