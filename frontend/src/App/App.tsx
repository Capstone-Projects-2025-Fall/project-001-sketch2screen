import styles from "./App.module.css"

import {useState} from "react"

import Navbar from "./Navbar"

export enum Page {
  Drawing,
  Mockup
}

export default function App() {
  let [currentPage, setCurrentPage] = useState(Page.Drawing)

  return <>
    <Navbar curPage={currentPage} onPageChange={setCurrentPage}/>
    {(currentPage == Page.Drawing) && "DRAWING PAGE"}
    {(currentPage == Page.Mockup) && "MOCKUP PAGE"}
  </>
}
