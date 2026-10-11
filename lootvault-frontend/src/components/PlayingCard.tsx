import type { CardRank, CardSuit, VisibleCard } from "../types/game";
import { motion } from "framer-motion";
import { useReducedMotion } from "../preferences/motion";
import styles from "./PlayingCard.module.css";

const SUITS: Record<CardSuit, string> = { HEARTS: "♥", DIAMONDS: "♦", CLUBS: "♣", SPADES: "♠" };
const RANKS: Partial<Record<CardRank, string>> = { 11: "J", 12: "Q", 13: "K", 14: "A" };
export default function PlayingCard({ card, index = 0 }: { card: VisibleCard; index?: number }) {
    const reduced = useReducedMotion();
    const hidden = !card || card.suit === "BACK";
    const face = card && card.suit !== "BACK" ? card : null;
    const rank = face ? RANKS[face.rank] || face.rank : "";
    const red = card?.suit === "HEARTS" || card?.suit === "DIAMONDS";
    return <motion.div className={styles.card} data-playing-card={hidden ? "back" : "face"} role="img" aria-label={hidden ? "Face-down card" : `${rank} of ${face?.suit.toLowerCase()}`}
        initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .2, delay: reduced ? 0 : index * .04 }}>
        <motion.div className={styles.rotator} data-card-flip aria-hidden="true" initial={reduced ? false : { rotateY: 180 }} animate={{ rotateY: hidden ? 180 : 0 }} transition={{ duration: reduced ? 0 : .42, delay: reduced ? 0 : index * .04, ease: [.22,.68,.25,1] }}>
            <div className={`${styles.face} ${styles.front} ${red ? styles.red : ""}`}>
                <span className={styles.corner} data-card-rank>{rank}<small>{face ? SUITS[face.suit] : ""}</small></span>
                <span className={styles.suit} data-card-suit>{face ? SUITS[face.suit] : ""}</span>
                <span className={styles.bottom} data-card-bottom>{rank}</span>
            </div>
            <div className={`${styles.face} ${styles.back}`}><span className={styles.monogram}>LV</span></div>
        </motion.div>
    </motion.div>;
}
