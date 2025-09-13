import {Page} from "./App.tsx"

import styles from "./App.module.css"

export default function Navbar({curPage, onPageChange} : {curPage: Page, onPageChange: () => Page}) {
  return <div className={styles.navbar}>
    <div className={styles.logo}>
      Sketch2Screen
    </div>
    <div className={styles.filename}>
      [File Name]
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
      <button className={styles.collabButton}>
        Collaborate
      </button>
      <button className={styles.collabButton}>
        Generate
      </button>
    </div>
  </div>
}
