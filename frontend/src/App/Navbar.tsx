import {Page} from "./App.tsx"
//import React from "react";
import styles from "./App.module.css"

type Props = {
  curPage: Page;
  onPageChange: (p: Page) => void;
  filename?: string;
  onFilenameChange?: (name: string) => void;
  onStartCollab?: () => void;
  onGenerate?: () => void; // new prop
};

export default function Navbar({curPage, onPageChange, filename = "untitled.sketch", onFilenameChange, onStartCollab, onGenerate} : Props) {
  /*
  const btn = (selected: boolean) =>
    [styles.pageSwitchButton, selected ? styles.pageSwitchSelected : ""]
      .filter(Boolean)
      .join(" ");
      */

 const handleNameInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onFilenameChange?.(e.target.value);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
  };
  return<div className={styles.navbar}>
    <div className={styles.logo}>
      Sketch2Screen
    </div>
    <div className={styles.filename}>
       <input
        value={filename}
        onChange={handleNameInput}
        onKeyDown={handleKeyDown}
        aria-label="Filename"
        placeholder="Name of sketch here"
        spellCheck={false}
        />
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
      <button className={styles.generateButton} onClick={onGenerate}>
        Generate
      </button>
    </div>
  </div>
}
