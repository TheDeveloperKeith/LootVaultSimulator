import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { RARITY_LABEL, RARITY_WEIGHT } from "../sandbox/items";
import styles from "./BannerPage.module.css";

const pct = (weight) => `${+(weight * 100).toFixed(1)}%`;

// Left to right = second, first, third, so the tallest block lands in the middle.
// Odds come from the same weights the Sandbox uses, so the two pages never disagree.
const PODIUM = [
    { id: "extraordinary", place: "second", Shadow: SwordShadow, label: RARITY_LABEL.EXTRAORDINARY, chance: pct(RARITY_WEIGHT.EXTRAORDINARY) },
    { id: "mystery", place: "first", Shadow: HoodShadow, label: "???", chance: null },
    { id: "exotic", place: "third", Shadow: ShieldShadow, label: RARITY_LABEL.EXOTIC, chance: pct(RARITY_WEIGHT.EXOTIC) },
];

// Sword and shield match the two item types the Sandbox already rolls.
function SwordShadow() {
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <polygon points="32,3 37,40 27,40" />
            <rect x="19" y="40" width="26" height="5" rx="2" />
            <rect x="29.5" y="45" width="5" height="10" />
            <circle cx="32" cy="58" r="3.5" />
        </svg>
    );
}

function ShieldShadow() {
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 4 54 12v18c0 14-10 24-22 30C20 54 10 44 10 30V12Z" />
        </svg>
    );
}

function HoodShadow() {
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 5C22 5 18 15 18 24c0 6-4 12-6 34h40c-2-22-6-28-6-34 0-9-4-19-14-19Z" />
            <ellipse cx="32" cy="25" rx="7" ry="9" className={styles.hoodFace} />
        </svg>
    );
}

function ChestShadow() {
    return (
        <svg viewBox="0 0 160 130" className={styles.chestSvg} aria-hidden="true">
            <defs>
                <linearGradient id="peekBeam" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon className={styles.beam} points="30,64 130,64 175,-20 -15,-20" fill="url(#peekBeam)" />
            <rect x="20" y="60" width="120" height="60" rx="4" fill="#000" />
            <rect x="20" y="82" width="120" height="5" fill="#1b2438" />
            <rect x="72" y="70" width="16" height="20" rx="2" fill="#1b2438" />
            <g className={styles.lid}>
                <path d="M20 60V44C20 26 40 16 80 16s60 10 60 28v16Z" fill="#000" />
                <rect x="20" y="52" width="120" height="5" fill="#1b2438" />
            </g>
        </svg>
    );
}

// Portaled to <body> like RarityBurst, so no ancestor can clip or restack it.
function SneakPeek({ onClose }) {
    const [run, setRun] = useState(0); // bumping this remounts the stage and replays the animation

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return createPortal(
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-label="Sneak peek"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div key={run} className={styles.stage}>
                    <div className={styles.reveal}>???</div>
                    <div className={styles.chest}>
                        <ChestShadow />
                    </div>
                </div>
                <p className={styles.caption}>Whatever is inside stays hidden until launch.</p>
                <div className={styles.actions}>
                    <button type="button" className={styles.ghostBtn} onClick={() => setRun((n) => n + 1)}>
                        Replay
                    </button>
                    <button type="button" className={styles.actionBtn} onClick={onClose}>
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}

export default function BannerPage() {
    const [peeking, setPeeking] = useState(false);

    return (
        <div className={styles.page}>
            <div className={styles.head}>
                <h1 className={styles.title}>Banners</h1>
                <p className={styles.sub}>Limited-time item pools are on the way.</p>
            </div>

            <section className={styles.panel} aria-label="The Hidden Vault banner">
                <div className={styles.panelHead}>
                    <span className={styles.soonTag}>Coming soon</span>
                    <h2 className={styles.bannerTitle}>The Hidden Vault</h2>
                    <p className={styles.note}>Drop rates may change before launch.</p>
                </div>

                <div className={styles.podium}>
                    {PODIUM.map(({ id, place, Shadow, label, chance }) => (
                        <div key={id} className={`${styles.tier} ${styles[id]} ${styles[place]}`}>
                            <div className={styles.figure}>
                                <Shadow />
                            </div>
                            <div className={styles.block}>
                                <span className={styles.rarity}>{label}</span>
                                {chance && <span className={styles.chance}>{chance}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <button type="button" className={styles.actionBtn} onClick={() => setPeeking(true)}>
                    Sneak peek
                </button>
            </section>

            <p className={styles.back}>
                <Link to="/modes">Back to Modes</Link>
            </p>

            <AnimatePresence>{peeking && <SneakPeek onClose={() => setPeeking(false)} />}</AnimatePresence>
        </div>
    );
}
