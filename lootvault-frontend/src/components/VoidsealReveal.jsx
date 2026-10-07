import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import ItemIcon from "./ItemIcon";
import useRevealSounds from "./useRevealSounds";
import blackHole from "../assets/audio/voidseal-black-hole.mp3";
import styles from "./VoidsealReveal.module.css";
const CUES=[{src:blackHole,delay:200}];
export default function VoidsealReveal({onDone,reduced}) {
 const skip=useRef(null);useRevealSounds(CUES,!reduced);
 useEffect(()=>{const previous=document.activeElement;skip.current?.focus();return()=>{if(previous?.isConnected)previous.focus();};},[]);
 return createPortal(<div className={`${styles.screen} ${reduced?styles.reduced:""}`} role="dialog" aria-modal="true" aria-label="Voidseal Aegis reveal" onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();onDone();}if(event.key==="Tab"){event.preventDefault();skip.current?.focus();}}}>
 <button ref={skip} onClick={onDone}>Skip animation ↗</button>
 {!reduced&&<><div className={styles.hole}/><div className={styles.rings}/><div className={styles.prophecy}>NOTHING SHALL PASS.</div><div className={styles.arrows}>{Array.from({length:12},(_,i)=><div key={i} className={styles.arrowLane} style={{"--angle":`${i*30}deg`,"--delay":`${2+(i%6)*.18}s`}}><svg viewBox="0 0 150 30"><path d="M5 15H135M112 3L140 15L112 27M15 15L2 3M15 15L2 27" fill="none" stroke="currentColor" strokeWidth="4"/></svg><i/></div>)}</div><div className={styles.finalSlash}/><div className={styles.impact}/></>}
 <div className={styles.reward}><div className={styles.guard}><ItemIcon name="Voidseal Aegis" size={240}/></div><div className={styles.name}><small>???? · THE UNBREAKABLE SEAL</small><h2>Voidseal Aegis</h2><p>THE VOID STRIKES. THE AEGIS STANDS.</p></div></div></div>,document.body);
}
