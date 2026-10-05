import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "../preferences/motion";
import PlayingCard from "../components/PlayingCard";
import styles from "./HandFaithSequence.module.css";
import { playGlassShatter } from "../sfx";

export default function HandFaithSequence({ round, username, tableRef, contained = false, audioAllowed = true, motionAllowed = true }) {
    const reducedMotion = useReducedMotion();
    const cards = [...round.opponents.flatMap(seat => seat.cards), ...round.board, ...Array(5 - round.board.length).fill(null), ...round.cards];
    const overlay = useRef(null);
    const opponentCount = round.opponents.reduce((count, seat) => count + seat.cards.length, 0);
    const playerStart = opponentCount + 5;
    const scattered = [...cards, ...Array(18).fill(null)];
    const sounded = useRef(false);
    useEffect(() => {
        let mounted = true;
        let stop;
        Promise.resolve().then(() => {
            if (audioAllowed && mounted && !sounded.current) { sounded.current = true; stop = playGlassShatter(); }
        });
        return () => { mounted = false; stop?.(); };
    }, [audioAllowed]);
    useLayoutEffect(() => {
        const sources = tableRef.current?.querySelectorAll('[data-scatter-source] > [role="img"]') || [];
        const targets = overlay.current?.querySelectorAll('[data-scattered-card]') || [];
        const animations = [];
        if (reducedMotion || !motionAllowed) return;
        targets.forEach((target, index) => {
            const source = sources[index % sources.length];
            if (!source) return;
            const from = source.getBoundingClientRect();
            const to = target.getBoundingClientRect();
            animations.push(target.animate([
                { transform:`translate(${from.left - to.left}px,${from.top - to.top}px) rotate(0deg)`, opacity:1 },
                { transform:`translate(0,0) rotate(${(index * 137) % 320 - 160}deg)`, opacity:index < sources.length ? .65 : .28 }
            ], { duration:1500 + (index % 9) * 110, delay:index < sources.length ? 0 : (index % 6) * 90, easing:'cubic-bezier(.12,.7,.25,1)', fill:'forwards' }));
        });
        return () => animations.forEach(animation => animation.cancel());
    }, [tableRef, reducedMotion, motionAllowed]);
    const phrases = ["Do you have faith?", "Do you believe?", `Do not despair, ${username || "traveler"}.`, "KNOW WHEN TO PAUSE", "PUSH FORWARD", "WHAT'S YOUR NAME?", "???", "THE SKY KNOWS", "STAND AGAINST FATE", "YOUR WILL REMAINS", "DO YOU HEAR IT?", "BEYOND THE SILENCE", "BREAK THE LIMIT", "LET THE HEAVENS ANSWER", "ONE HAND. ONE DESTINY.", "YOU CAN BEGIN AGAIN", "RISE AGAIN", "THE STARS ARE WATCHING", "FEAR WILL NOT DECIDE", "KEEP YOUR FAITH", "THIS IS YOUR MOMENT", "WHO WILL REMAIN?", "REACH BEYOND DESPAIR", "NAME YOUR DESTINY", "THE RIVER REMEMBERS", "DO NOT LOOK AWAY", "EVEN NOW, BELIEVE", "THE NEXT CARD CALLS"];
    const content = (<><div ref={overlay} className={styles.scene} style={contained ? {position:"absolute",zIndex:1} : undefined} aria-hidden="true">
        {scattered.map((card,index)=><div data-scattered-card key={index} className={`${styles.card} ${index >= playerStart && index < cards.length ? styles.playerGlow : index >= opponentCount && index < playerStart ? styles.riverGlow : ""}`} style={{left:`${2 + (index * 37) % 91}%`,top:`${2 + (index * 29) % 87}%`,transform:`rotate(${(index * 137) % 320 - 160}deg)`,opacity:index < cards.length ? .65 : .28}}><PlayingCard card={card} /></div>)}
    </div><div className={styles.phraseScene} style={contained ? {position:"absolute",zIndex:3} : undefined} aria-hidden="true">{phrases.map((phrase,index)=><span className={styles.phrase} key={phrase} style={{left:`${9 + (index * 23) % 83}%`,animationDelay:`${index * .7}s`,animationDuration:`${17 + index % 5}s`,"--phrase-size":`${1.4 + index % 4 * .3}rem`}}>{phrase}</span>)}</div></>);
    return contained ? content : createPortal(content, document.body);
}
