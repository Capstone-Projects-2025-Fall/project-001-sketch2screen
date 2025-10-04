import React from 'react';

export default function TDFrame(props) {
  return <div style={{width: "100%", height:"40em"}}>
      <a href={props.src}>Fullscreen</a>
      <iframe src={props.src} style={{width: "100%", height:"100%"}}>
      </iframe>
    </div>
}
