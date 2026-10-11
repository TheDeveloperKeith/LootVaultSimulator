import { useEffect,useEffectEvent,useRef,useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "../preferences/motion";
import { isMuted, playGameEffect } from "../sfx";
import { soundLevel } from "../audio/volume";
import eclipseMusic from "../assets/audio/banner-eclipse.mp3";
import sunbreakMusic from "../assets/audio/banner-sunbreak.mp3";
import stormMusic from "../assets/audio/banner-stormheart.mp3";
import astralMusic from "../assets/audio/banner-astral.mp3";
const TRACKS={eclipse:{src:eclipseMusic,reveal:7,duration:21},sunbreak:{src:sunbreakMusic,reveal:9,duration:16},stormheart:{src:stormMusic,reveal:12,duration:23},astral:{src:astralMusic,reveal:11,duration:18}};
import burningAudio from "../assets/audio/banner-burning.wav";
import battleAudio from "../assets/audio/banner-battle.wav";
import rainAudio from "../assets/audio/exotic-rain.wav";
import ItemIcon from "./ItemIcon";
import BannerBuildUp from "./BannerBuildUp";
import styles from "./LimitedReveal.module.css";
export default function LimitedReveal({item,onDone}) {
 const reduced=useReducedMotion();const button=useRef(null);const scene=useRef(null);const complete=useEffectEvent(()=>onDone());
 const track=TRACKS[item.effect];const [revealed,setRevealed]=useState(false);const timeline=useRef({elapsed:0});
 useEffect(() => {
  const previous = document.activeElement;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  button.current?.focus();
  const audio = new Audio(track.src);
  const fxSrc = item.effect === "sunbreak" ? burningAudio : item.effect === "stormheart" ? rainAudio : item.effect === "astral" ? battleAudio : null;
  const fx = fxSrc ? new Audio(fxSrc) : null;
  if (fx) fx.loop = true;
  const sync = () => { audio.volume = isMuted() ? 0 : soundLevel("music") * .8; };
  const syncFx = () => { if (fx) fx.volume = isMuted() ? 0 : soundLevel("effects") * .65; };
  sync(); syncFx();
  window.addEventListener("lootvault:sound-changed", sync);
  window.addEventListener("lootvault:sound-changed", syncFx);
  let disposed = false, frame, musicStarted = false, fallback = false;
  let didReveal = false, didFinish = false, didStartFx = false;
  const start = performance.now();
  timeline.current.elapsed = 0;
  // Audio playback is the clock, including buffering and tab throttling.
  // Autoplay rejection uses a silent clock so the animation remains skippable.
  void audio.play().then(() => {
   if (disposed) { audio.pause(); return; }
   musicStarted = true;
  }).catch(() => { fallback = true; });
  const fxAt = Math.max(0, track.reveal - (item.effect === "sunbreak" ? 0 : 5));
  // Continue the scripted hold from the media end, if the source is shorter.
  let endedAt = null;
  const onEnded = () => { endedAt = performance.now(); };
  audio.addEventListener("ended", onEnded);
  const tick = now => {
   if (disposed || didFinish) return;
   const elapsed = reduced || fallback ? (now - start) / 1000
    : endedAt !== null ? audio.currentTime + (now - endedAt) / 1000
    : musicStarted ? audio.currentTime : 0;
   timeline.current.elapsed = elapsed;
   scene.current?.style.setProperty("--reward-opacity", String(reduced ? 1 : Math.max(0, Math.min(1, track.duration - elapsed))));
   if (!reduced && fx && !didStartFx && elapsed >= fxAt) {
    didStartFx = true;
    void fx.play().then(() => { if (disposed) fx.pause(); }).catch(() => {});
   }
   if (!didReveal && elapsed >= (reduced ? .15 : track.reveal)) {
    didReveal = true; setRevealed(true);
    if (!reduced && item.effect !== "eclipse") playGameEffect("reward", .4, 1.1);
   }
   if (elapsed >= (reduced ? 2 : track.duration)) {
    didFinish = true; complete(); return;
   }
   frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => {
   disposed = true; cancelAnimationFrame(frame); audio.pause(); fx?.pause();
   audio.removeEventListener("ended", onEnded);
   window.removeEventListener("lootvault:sound-changed", sync);
   window.removeEventListener("lootvault:sound-changed", syncFx);
   document.body.style.overflow = previousOverflow;
   if (previous?.isConnected) previous.focus();
  };
 }, [track, reduced, item.effect]);
 return createPortal(<div ref={scene} role="dialog" aria-modal="true" aria-label={`${item.name} limited reveal`} className={`${styles.scene} ${styles[item.effect]} ${reduced ? styles.reduced : ""}`} style={{"--color":item.color}} onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();event.stopPropagation();onDone();}if(event.key==="Tab"){event.preventDefault();button.current?.focus();}}}><BannerBuildUp effect={item.effect} timeline={timeline} revealAt={track.reveal} reduced={reduced}/><button ref={button} onClick={onDone}>Skip animation ↗</button>{revealed&&!reduced&&<div className={styles.world} aria-hidden="true">{item.effect==="eclipse"?<><div className={styles.blackSun}/><div className={styles.rift}/><div className={styles.eclipseRing}/></>:item.effect==="sunbreak"?<><div className={styles.sun}/><div className={styles.horizon}/><div className={styles.dawnSlash}/></>:item.effect==="stormheart"?<><div className={styles.clouds}/>{Array.from({length:5},(_,i)=><div key={i} className={styles.bolt} style={{"--n":i}}/>)}</>:<><div className={styles.planet}/><div className={styles.sigil}/>{Array.from({length:40},(_,i)=><i key={i} className={styles.star} style={{left:`${(i*37)%100}%`,top:`${(i*23)%100}%`,"--n":i%7}}/>)}</>}</div>}{revealed&&!reduced&&<div className={styles.summonAura} aria-hidden="true"><div className={styles.summonRing}/><div className={styles.mist}/><div className={styles.rainbowWave}/>{Array.from({length:28},(_,i)=><i key={i} className={styles.spark} style={{"--i":i,left:`${(i*37)%100}%`,top:`${(i*19)%95}%`}}>✦</i>)}</div>}{revealed&&!reduced&&<div className={styles.energy}>{Array.from({length:12},(_,i)=><i key={i} style={{"--i":i}}/>)}</div>}{revealed&&<div className={styles.relic}><span className={styles.arrival}>{item.effect==="eclipse"?"SECRET AWAKENING":"MYTHIC DISCOVERY"}</span><small>{item.effect==="eclipse"?"SECRET RELIC · AWAKENED":"LIMITED · ????"}</small><ItemIcon name={item.name} size={200}/><h2>{item.name}</h2><p>{item.effect==="eclipse"?"EVEN THE DARKNESS HAS A DAWN":item.effect==="sunbreak"?"BREAK THROUGH THE DAWN":item.effect==="stormheart"?"THE STORM ANSWERS":"STAND BEYOND THE STARS"}</p></div>}</div>,document.body);
}
