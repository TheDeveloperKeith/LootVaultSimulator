import { useEffect } from "react";
import { isMuted } from "../sfx";
import { soundLevel } from "../audio/volume";
export default function useRevealSounds(cues, enabled) {
 useEffect(() => {
  if (!enabled) return;
  const sounds=cues.map(cue=>({audio:new Audio(cue.src),delay:cue.delay}));
  const sync=()=>sounds.forEach(({audio})=>{audio.volume=isMuted()?0:soundLevel("effects")*.75;});
  sync();window.addEventListener("lootvault:sound-changed",sync);
  const timers=sounds.map(({audio,delay})=>setTimeout(()=>{void audio.play().catch(()=>{});},delay));
  return()=>{timers.forEach(clearTimeout);sounds.forEach(({audio})=>audio.pause());window.removeEventListener("lootvault:sound-changed",sync);};
 },[cues,enabled]);
}
