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
const PHRASES={sunbreak:["THE EMBERS REMEMBER","RISE ABOVE THE ASHES","LET THE DAWN BREAK"],stormheart:["THE TIDES ARE TURNING","HEAR THE OCEAN ROAR","THE STORM ANSWERS"],astral:["HOLD THE LINE","STAND BEYOND THE STARS","THE BASTION ENDURES"],eclipse:["SOMETHING STIRS IN THE DARK","DO YOU BELIEVE?","EVEN DARKNESS HAS A DAWN"]};
import ItemIcon from "./ItemIcon";
import styles from "./LimitedReveal.module.css";
export default function LimitedReveal({item,onDone}) {
 const reduced=useReducedMotion();const button=useRef(null);const complete=useEffectEvent(()=>onDone());
 const track=TRACKS[item.effect];const [revealed,setRevealed]=useState(false);const [phrase,setPhrase]=useState(0);
 useEffect(()=>{const previous=document.activeElement;button.current?.focus();const audio=new Audio(track.src);const sync=()=>{audio.volume=isMuted()?0:soundLevel("music")*.8;};sync();window.addEventListener("lootvault:sound-changed",sync);void audio.play().catch(()=>{});
 const phraseTimer=setInterval(()=>setPhrase(index=>index+1),1900);
 const fxSrc=item.effect==="sunbreak"?burningAudio:item.effect==="stormheart"?rainAudio:item.effect==="astral"?battleAudio:null;
 const fx=fxSrc?new Audio(fxSrc):null;if(fx)fx.loop=true;const syncFx=()=>{if(fx)fx.volume=isMuted()?0:soundLevel("effects")*.65;};syncFx();window.addEventListener("lootvault:sound-changed",syncFx);
 const fxTimer=fx&&!reduced?setTimeout(()=>{void fx.play().catch(()=>{})},Math.max(0,track.reveal-(item.effect==="sunbreak"?0:5))*1000):null;
 const revealTimer=setTimeout(()=>{setRevealed(true);if(!reduced&&item.effect!=="eclipse")playGameEffect("reward",.4,1.1)},reduced?150:track.reveal*1000);
 const finishTimer=setTimeout(complete,reduced?2000:track.duration*1000);
 return()=>{clearInterval(phraseTimer);clearTimeout(fxTimer);fx?.pause();window.removeEventListener("lootvault:sound-changed",syncFx);clearTimeout(revealTimer);clearTimeout(finishTimer);audio.pause();window.removeEventListener("lootvault:sound-changed",sync);if(previous?.isConnected)previous.focus();};},[track,reduced,item.effect]);
 return createPortal(<div role="dialog" aria-modal="true" aria-label={`${item.name} limited reveal`} className={`${styles.scene} ${styles[item.effect]} ${!revealed ? styles.intro : ""} ${item.effect==="eclipse"&&!revealed&&!reduced?styles.eclipseShake:""}`} style={{"--color":item.color}} onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();event.stopPropagation();onDone();}if(event.key==="Tab"){event.preventDefault();button.current?.focus();}}}><button ref={button} onClick={onDone}>Skip animation ↗</button>{revealed&&!reduced&&<div className={styles.world} aria-hidden="true">{item.effect==="eclipse"?<><div className={styles.blackSun}/><div className={styles.rift}/><div className={styles.eclipseRing}/></>:item.effect==="sunbreak"?<><div className={styles.sun}/><div className={styles.horizon}/><div className={styles.dawnSlash}/></>:item.effect==="stormheart"?<><div className={styles.clouds}/>{Array.from({length:5},(_,i)=><div key={i} className={styles.bolt} style={{"--n":i}}/>)}</>:<><div className={styles.planet}/><div className={styles.sigil}/>{Array.from({length:40},(_,i)=><i key={i} className={styles.star} style={{left:`${(i*37)%100}%`,top:`${(i*23)%100}%`,"--n":i%7}}/>)}</>}</div>}{revealed&&!reduced&&<div className={styles.summonAura} aria-hidden="true"><div className={styles.summonRing}/><div className={styles.mist}/><div className={styles.rainbowWave}/>{Array.from({length:28},(_,i)=><i key={i} className={styles.spark} style={{"--i":i,left:`${(i*37)%100}%`,top:`${(i*19)%95}%`}}>✦</i>)}</div>}{revealed&&!reduced&&<div className={styles.energy}>{Array.from({length:12},(_,i)=><i key={i} style={{"--i":i}}/>)}</div>}{!revealed&&<div className={styles.prophecy}><small>{item.effect==="eclipse"?"THE SEALED SECRET":"A RELIC IS AWAKENING"}</small><h2 key={phrase} className={styles.phrase}>{PHRASES[item.effect][phrase%PHRASES[item.effect].length]}</h2>{item.effect==="eclipse"&&!reduced&&<div className={styles.secretRise} aria-hidden="true">{Array.from({length:96},(_,i)=><span key={i} style={{"--i":i,"--x":`${(i*37)%100}%`,"--delay":`${-(i%17)*.23}s`,"--size":`${1.5+(i%7)*.55}rem`,"--duration":`${2.4+(i%5)*.35}s`}}>????</span>)}</div>}</div>}{revealed&&<div className={styles.relic} style={{"--hold":`${Math.max(1,track.duration-track.reveal-1)}s`}}><span className={styles.arrival}>{item.effect==="eclipse"?"SECRET AWAKENING":"MYTHIC DISCOVERY"}</span><small>{item.effect==="eclipse"?"SECRET RELIC · AWAKENED":"LIMITED · ????"}</small><ItemIcon name={item.name} size={200}/><h2>{item.name}</h2><p>{item.effect==="eclipse"?"EVEN THE DARKNESS HAS A DAWN":item.effect==="sunbreak"?"BREAK THROUGH THE DAWN":item.effect==="stormheart"?"THE STORM ANSWERS":"STAND BEYOND THE STARS"}</p></div>}</div>,document.body);
}
