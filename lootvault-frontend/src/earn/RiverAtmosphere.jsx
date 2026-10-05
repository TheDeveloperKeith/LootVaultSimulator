import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "../preferences/motion";
import { isMuted } from "../sfx";
import { createHeavenlyChoir } from "./heavenlyChoir";
import heavenlyMusic from "../assets/audio/hard-battle-2-mintodog.mp3";
import intenseMusic from "../assets/audio/monarch-dutonic.mp3";
import { pokerAtmosphere, riverMusicTier } from "./pokerAtmosphere";
import styles from "../pages/EarnLootPage.module.css";

export default function RiverAtmosphere({ round, sceneRef, revealing = false, audioAllowed = true, contained = false, motionAllowed = true }) {
    const reducedMotion = useReducedMotion();
    const { level, label } = pokerAtmosphere(round);
    const [peak, setPeak] = useState(level >= 2 ? level : 0);
    if (level >= 2 && level > peak) setPeak(level);
    const active = round?.game === "HOLDEM" && round.stage !== "COMPLETE";
    const intensity = active ? Math.max(1, peak) : revealing && round?.game === "HOLDEM" ? Math.max(peak, round.showdown?.extreme ? 4 : 2) : 0;
    const stage = round?.stage;
    const musicTier = riverMusicTier(round);
    const music = musicTier === 2 ? heavenlyMusic : intenseMusic;
    const audioRef = useRef(null);
    const choirRef = useRef(null);
    const extremeStarted = useRef(false);
    const musicStarted = useRef(false);
    const pendingSeek = useRef(false);
    const seekOffset = useRef(0);
    const extremeSeeked = useRef(false);
    const [enabled, setEnabled] = useState(true);
    const [blocked, setBlocked] = useState(false);
    useEffect(() => {
        if (!active || intensity < 2) return;
        const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
        let animation;
        const enteringExtreme = intensity >= 3 && !extremeStarted.current;
        if (intensity >= 3) extremeStarted.current = true;
        const sync = () => {
            animation?.cancel();
            if (!motionAllowed || reducedMotion || preference.matches) return;
            const strength = intensity >= 3 ? (stage === "RIVER" ? 40 : stage === "TURN" ? 34 : 28) + (intensity === 4 ? 6 : 0) : (stage === "RIVER" ? 10 : stage === "TURN" ? 6 : 3) + (intensity === 3 ? 2 : 0);
            const offsets = [[0,0],[-1,.5],[1,-.4],[-.85,-.3],[.75,.35],[-.6,.25],[.5,-.2],[-.35,.15],[.2,-.1],[0,0]];
            animation = sceneRef.current?.animate(offsets.map(([x,y]) => ({transform:`translate(${x * strength}px,${y * strength}px) ${intensity >= 3 ? "rotate(.3deg)" : ""}`})), {delay:enteringExtreme ? 700 : 0,duration:intensity >= 3 ? 160 : stage === "RIVER" ? 430 : 650,iterations:Infinity,easing:"linear"});
        };
        sync(); preference.addEventListener("change", sync);
        return () => { animation?.cancel(); preference.removeEventListener("change", sync); };
    }, [active, intensity, stage, sceneRef, reducedMotion, motionAllowed]);
    useEffect(() => {
        const audio = audioRef.current;
        let fadeInterval;
        let revealTimer;
        let fading = false;
        const fadeOut = () => {
            if (fading) return;
            fading = true;
            const volume = audio.volume;
            const started = Date.now();
            void choirRef.current?.setLevel(0);
            fadeInterval = setInterval(() => {
                const progress = Math.min(1, (Date.now() - started) / 1800);
                audio.volume = volume * (1 - progress);
                if (progress === 1) { clearInterval(fadeInterval); audio.pause(); audio.currentTime = 0; }
            }, 40);
        };
        const sync = () => {
            if (!enabled || !audioAllowed || isMuted()) { audio.pause(); void choirRef.current?.setLevel(0); return; }
            if (intensity < 2 || musicTier === 0) { fadeOut(); return; }
            if (fading) return;
            if (musicStarted.current !== music) {
                musicStarted.current = music;
                audio.load();
                seekOffset.current = intensity >= 3 ? 30 : 0;
                pendingSeek.current = audio.readyState < 1;
                if (!pendingSeek.current) audio.currentTime = intensity >= 3 ? (Number.isFinite(audio.duration) && audio.duration > 0 ? 30 % audio.duration : 30) : 0;
            }
            if (intensity >= 3 && !extremeSeeked.current) {
                extremeSeeked.current = true;
                seekOffset.current = 30;
                pendingSeek.current = audio.readyState < 1;
                if (!pendingSeek.current) audio.currentTime = Number.isFinite(audio.duration) && audio.duration > 0 ? 30 % audio.duration : 30;
            }
            audio.volume = intensity >= 4 ? .65 : intensity === 3 ? (stage === "RIVER" ? .58 : stage === "TURN" ? .52 : .44) : intensity === 2 ? .34 : .16;
            if (musicTier === 2) choirRef.current ||= createHeavenlyChoir();
            void choirRef.current?.setLevel(musicTier === 2 ? .85 + (stage === "RIVER" || revealing ? .15 : 0) : 0).catch(() => setBlocked(true));
            if (audio.paused) void audio.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
        };
        sync(); window.addEventListener("lootvault:sound-changed", sync);
        if (revealing && round?.game === "HOLDEM") revealTimer = setTimeout(fadeOut, round.showdown?.extreme ? 10000 : reducedMotion ? 1000 : 4900);
        // Stage changes adjust volume without pausing or restarting the track.
        return () => { clearInterval(fadeInterval); clearTimeout(revealTimer); window.removeEventListener("lootvault:sound-changed", sync); };
    }, [intensity, stage, enabled, revealing, round?.game, round?.showdown?.extreme, music, musicTier, reducedMotion, audioAllowed]);
    useEffect(() => { const audio = audioRef.current; return () => { audio.pause(); choirRef.current?.stop(); }; }, []);
    const veil = <div className={styles.extremeVeil} style={contained ? {position:"absolute",zIndex:2} : undefined} aria-hidden="true" />;
    return <><audio ref={audioRef} src={music} loop preload="none" onLoadedMetadata={() => {
        if (pendingSeek.current) { audioRef.current.currentTime = Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0 ? seekOffset.current % audioRef.current.duration : seekOffset.current; pendingSeek.current = false; }
    }} />{active && intensity >= 3 && (contained ? veil : createPortal(veil, document.body))}{active && !contained && <div className={`${styles.atmosphere} ${intensity >= 2 ? styles.intense : ""}`}><span role="status">{intensity >= 2 && level < 2 ? "The tension stays · showdown awaits" : label}<small>{intensity >= 3 ? "EXTREME · sky ascent incoming" : intensity >= 2 ? "Intensity locked until the result" : "Hand cues, not winning odds"}</small></span><button aria-pressed={enabled} onClick={() => {
        if (blocked && enabled && musicTier > 0 && intensity >= 2 && !isMuted()) { void audioRef.current.play().then(() => setBlocked(false)).catch(() => {});
            void choirRef.current?.setLevel(musicTier === 2 ? .85 : 0).catch(() => {}); }
        else setEnabled(value => !value);
    }}>{!enabled ? "Music off" : musicTier === 0 ? "Music armed ♫" : blocked ? "Play music" : "Music on ♫"}</button></div>}</>;
}
