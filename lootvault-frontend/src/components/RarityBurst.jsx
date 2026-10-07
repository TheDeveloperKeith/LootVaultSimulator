import { useReducedMotion } from "../preferences/motion";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RARITY_LABEL } from "../rarities";
import styles from "./RarityBurst.module.css";
import { playRarityFanfare } from "../sfx";
import { resolveItemDesign } from "../items/designs";
import LimitedReveal from "./LimitedReveal";
import ItemIcon from "./ItemIcon";
import VoidsealReveal from "./VoidsealReveal";
import useRevealSounds from "./useRevealSounds";
import swordSlice from "../assets/audio/crimson-sword-slice.mp3";
import shieldImpact from "../assets/audio/crimson-shield-impact.mp3";
const CRIMSON_CUES=[{src:swordSlice,delay:1150},{src:shieldImpact,delay:1480}];

const SCENES = {
    EXOTIC: { color: "#9ee3c6", eyebrow: "A RARE DISCOVERY", caption: "A rare reward, quietly revealed.", symbol: "◇" },
    EXTRAORDINARY: { color: "#f0d6a2", eyebrow: "A MOMENT WORTH KEEPING", caption: "A little luck. A remarkable reward.", symbol: "✦" },
    EXTRA_EXTRAORDINARY: { color: "#ef7885", eyebrow: "SOMETHING HAS AWAKENED", caption: "Some discoveries should have stayed hidden.", symbol: "✧" },
};

export default function RarityBurst({ rarity, itemName, itemType }) {
    const [skipped, setSkipped] = useState(false);
    const stopAudio = useRef(null);
    const skipButton = useRef(null);
    const reduced = useReducedMotion();
    const scene = SCENES[rarity];
    const limitedItem=resolveItemDesign(itemName);
    const limited=Boolean(limitedItem.effect);
    const voidseal=itemName === "Voidseal Aegis" && rarity === "EXTRA_EXTRAORDINARY";
    useRevealSounds(CRIMSON_CUES,itemName === "Mystery Harbor" && rarity === "EXTRA_EXTRAORDINARY" && !skipped && !reduced);
    const mystery = rarity === "EXTRA_EXTRAORDINARY";
    useEffect(() => { if (!limited && !voidseal) stopAudio.current = playRarityFanfare(rarity); return () => stopAudio.current?.(); }, [rarity,limited,voidseal]);
    useEffect(() => { const timer = setTimeout(() => setSkipped(true), reduced ? 2000 : limited ? 30000 : voidseal ? 7800 : 4800); const skip = () => { stopAudio.current?.(); setSkipped(true); }; window.addEventListener("lootvault:skip-reveal", skip); return () => { clearTimeout(timer); window.removeEventListener("lootvault:skip-reveal", skip); }; }, [reduced,limited,voidseal]);
    useEffect(() => { if (skipped) return; const previous = document.activeElement; skipButton.current?.focus({preventScroll:true}); return () => { if (previous?.isConnected) previous.focus({preventScroll:true}); }; }, [skipped]);
    if (!scene || skipped) return null;
    if(voidseal) return <VoidsealReveal reduced={reduced} onDone={() => setSkipped(true)}/>;
    if(limitedItem.effect) return <LimitedReveal item={limitedItem} onDone={() => setSkipped(true)}/>;
    return createPortal(
        <motion.div className={`${styles.cinema} ${mystery ? styles.ominous : ""}`} style={{ "--accent": scene.color }} role="dialog" aria-modal="true" aria-label="Rare item cutscene" onKeyDown={event => { if (event.key === "Tab") { event.preventDefault(); skipButton.current?.focus(); } if (event.key === "Escape") { event.preventDefault(); stopAudio.current?.(); setSkipped(true); } }}
            initial={{ opacity: mystery ? 1 : 0 }} animate={{ opacity: [mystery ? 1 : 0, 1, 1, 0] }}
            transition={{ duration: reduced ? 2 : 4.8, times: [0, .18, .78, 1], ease: "easeInOut" }}>
            <button ref={skipButton} className={styles.skipAnimation} onClick={() => { stopAudio.current?.(); setSkipped(true); }}>Skip animation ↗</button>
            <div className={styles.letterboxTop} /><div className={styles.letterboxBottom} />
            <div className={styles.ambient} /><div className={styles.beam} />
            {mystery && !reduced && <>
                <motion.div className={styles.warning} initial={{ opacity: 0 }} animate={{ opacity: [0, .65, 0] }} transition={{ duration: 1.3, times: [0, .45, 1] }}>THE VAULT GOES SILENT.</motion.div>
                <motion.div className={styles.swordFlight} initial={{ x: "-110vw", y: "-40vh", opacity: 0 }}
                    animate={{ x: ["-110vw", "0vw", "110vw"], y: ["-40vh", "0vh", "40vh"], opacity: [0, 1, 0] }}
                    transition={{ delay: 1.15, duration: .65, times: [0, .52, 1], ease: "easeIn" }}>
                    <svg viewBox="0 0 800 180" className={styles.redSword}>
                        <defs><linearGradient id="vault-red-blade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#4b0614"/><stop offset=".48" stopColor="#ff405b"/><stop offset=".54" stopColor="#ffd0d6"/><stop offset="1" stopColor="#850b27"/></linearGradient></defs>
                        <path d="M260 58 L690 62 L790 90 L690 118 L260 122 Z" fill="url(#vault-red-blade)" stroke="#ff617a" strokeWidth="2"/>
                        <path d="M280 90 L754 90" stroke="#ffc6cd" strokeWidth="2"/>
                        <path d="M235 20 L262 24 L277 60 L277 120 L262 156 L235 160 L245 116 L245 64 Z" fill="#160c14" stroke="#d72c4b" strokeWidth="4"/>
                        <path d="M135 75 L244 75 L244 105 L135 105 Z" fill="#160b12" stroke="#ae2340" strokeWidth="3"/>
                        <path d="M150 75 L165 105 M173 75 L188 105 M196 75 L211 105 M219 75 L234 105" stroke="#62142b" strokeWidth="5"/>
                        <path d="M115 90 L137 66 L155 90 L137 114 Z" fill="#d72c4b"/>
                    </svg>
                </motion.div>
                <motion.div className={styles.impactFrame} initial={{ opacity: 0 }} animate={{ opacity: [0, .65, 0] }} transition={{ delay: 1.48, duration: .18, times: [0, .25, 1] }} />
                <motion.div className={styles.screenCut} initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: [0, 1, 1], opacity: [0, .9, 0] }} transition={{ delay: 1.46, duration: 1.05, times: [0, .14, 1], ease: "easeOut" }} />
            </>}
            {rarity === "EXTRAORDINARY" && !reduced && <div className={styles.curtains}>
                {["left", "right"].map(side => <motion.div key={side} className={`${styles.curtain} ${styles[side]}`}
                    initial={{ x: "0%" }} animate={{ x: side === "left" ? "-102%" : "102%" }}
                    transition={{ delay: .35, duration: 1.9, ease: [.65, 0, .25, 1] }}><div className={styles.curtainHem} /></motion.div>)}
            </div>}
            {rarity === "EXOTIC" && !reduced && <div className={styles.rain}>
                {Array.from({ length: 48 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 104}%`, "--delay": `${-(i % 13) * .17}s`, "--duration": `${1.1 + (i % 7) * .14}s`, "--length": `${14 + (i % 5) * 8}px` }} />)}
                <div className={styles.windHalo} />
            </div>}
            {!reduced && <div className={styles.dust}>{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ "--i": i, left: `${12 + (i * 31) % 76}%`, top: `${15 + (i * 19) % 65}%` }} />)}</div>}
            <motion.div className={styles.scene} initial={{ opacity: 0, y: reduced ? 0 : 18, scale: reduced ? 1 : .97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: reduced ? .1 : mystery ? 1.75 : rarity === "EXTRAORDINARY" ? 1 : .65, duration: mystery ? .9 : 1.3, ease: [.22, 1, .36, 1] }}>
                <span className={styles.eyebrow}>{scene.eyebrow}</span>
                <div className={styles.rewardArt}><ItemIcon name={itemName || "Vault Relic"} type={itemType} size={180} /></div>
                <h2 className={styles.rewardName}>{itemName || "Vault Relic"}</h2>
                <strong className={styles.item}>{RARITY_LABEL[rarity]}</strong>
                <div className={styles.divider} /><p>{scene.caption}</p>
                <span className={styles.applauseNote}>{rarity === "EXTRAORDINARY" ? "A roaring round of applause" : rarity === "EXOTIC" ? "In the eye of the storm" : "An echo from somewhere unknown"}</span>
                {mystery && <div className={styles.audioCredit}>Music: <a href="https://www.newgrounds.com/audio/listen/1523222" target="_blank" rel="noreferrer">Monarch — Dutonic</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a> · timed excerpt</div>}
            </motion.div>
        </motion.div>, document.body
    );
}
