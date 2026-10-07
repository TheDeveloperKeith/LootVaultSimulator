import { useEffect, useState } from "react";
import { getVolumeSettings, setVolumeSetting } from "../audio/volume";
import { isMuted, setMuted } from "../sfx";
import { useReducedMotion, setReducedMotion } from "../preferences/motion";
import styles from "./SettingsPage.module.css";
export default function SettingsPage() {
 const [tab,setTab]=useState("audio");
 const [volumes,setVolumes]=useState(getVolumeSettings);
 const [muted,setMutedState]=useState(isMuted);
 const reduced=useReducedMotion();
 useEffect(()=>{const sync=()=>{setVolumes(getVolumeSettings());setMutedState(isMuted());};window.addEventListener("lootvault:sound-changed",sync);return()=>window.removeEventListener("lootvault:sound-changed",sync);},[]);
 return <section className={styles.page}><header data-page-header="true"><small>MAKE YOURSELF AT HOME</small><h1>Settings</h1><p>Saved automatically on this browser.</p></header><div className={styles.layout}><nav aria-label="Settings categories">{[["audio","Sound"],["comfort","Motion & help"]].map(([key,label])=><button key={key} aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</nav><section className={styles.panel} aria-label={tab==="audio"?"Sound settings":"Motion and help"}>{tab==="audio"?<><h2>Your sound, your pace.</h2><label className={styles.toggle}><span>Enable sound</span><input type="checkbox" checked={!muted} onChange={event=>setMuted(!event.target.checked)}/></label>{[["master","Overall volume"],["music","Music"],["effects","Effects & notifications"]].map(([key,label])=><label className={styles.slider} key={key}><span>{label}</span><output>{Math.round(volumes[key]*100)}%</output><input aria-label={label} aria-valuetext={`${Math.round(volumes[key]*100)} percent`} type="range" min="0" max="100" value={Math.round(volumes[key]*100)} onChange={event=>setVolumeSetting(key,Number(event.target.value)/100)}/></label>)}<a href="/audio-credits.html" target="_blank" rel="noreferrer">Music & sound credits ↗</a></>:<><h2>Play comfortably.</h2><label className={styles.toggle}><span>Reduce motion<small>Calmer reveals, less shaking, and simpler transitions.</small></span><input type="checkbox" checked={reduced} onChange={event=>setReducedMotion(event.target.checked)}/></label><p>Your system’s reduced-motion preference is always respected. Cutscenes also have a skip button.</p><button onClick={()=>window.dispatchEvent(new Event("lootvault:replay-tutorial"))}>Replay the introduction</button></>}</section></div></section>;
}
