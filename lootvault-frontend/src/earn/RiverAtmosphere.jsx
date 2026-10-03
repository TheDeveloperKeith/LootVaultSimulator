import { useEffect, useRef, useState } from "react";
import { isMuted } from "../sfx";
import music from "../assets/audio/monarch-dutonic.mp3";
import { pokerAtmosphere } from "./pokerAtmosphere";
import styles from "../pages/EarnLootPage.module.css";

export default function RiverAtmosphere({ round, sceneRef }) {
    const { level, label } = pokerAtmosphere(round);
    const audioRef = useRef(null);
    const [enabled, setEnabled] = useState(true);
    const [blocked, setBlocked] = useState(false);
    const cue = `${round?.id}:${round?.stage}:${label}`;
    useEffect(() => {
        if (level < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const animation = sceneRef.current?.animate([{transform:"translate(0,0)"},{transform:"translate(-4px,2px)"},{transform:"translate(4px,-2px)"},{transform:"translate(-2px,1px)"},{transform:"translate(0,0)"}], {duration:480,easing:"ease-out"});
        return () => animation?.cancel();
    }, [cue, level, sceneRef]);
    useEffect(() => {
        const audio = audioRef.current;
        const sync = () => {
            if (!level || !enabled || isMuted()) { audio.pause(); return; }
            audio.volume = level === 3 ? .48 : level === 2 ? .34 : .17;
            void audio.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
        };
        sync(); window.addEventListener("lootvault:sound-changed", sync);
        return () => { audio.pause(); window.removeEventListener("lootvault:sound-changed", sync); };
    }, [level, enabled]);
    return <><audio ref={audioRef} src={music} loop preload="none" />{level > 0 && <div className={`${styles.atmosphere} ${level > 1 ? styles.intense : ""}`}><span role="status">{label}<small>Hand cues, not winning odds</small></span><button aria-pressed={enabled} onClick={() => {
        if (blocked && enabled) { void audioRef.current.play().then(() => setBlocked(false)).catch(() => {}); }
        else setEnabled(value => !value);
    }}>{blocked && enabled ? "Play music" : enabled ? "Music on ♫" : "Music off"}</button></div>}</>;
}
