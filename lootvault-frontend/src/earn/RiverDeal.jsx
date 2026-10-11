import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../preferences/motion";
import styles from "./RiverDeal.module.css";

// Card destinations come from the actual responsive table, not fixed screen coordinates.
export default function RiverDeal({ ready, tableRef, onDone, game = "HOLDEM" }) {
    const reduced = useReducedMotion();
    const [targets, setTargets] = useState(null);
    useEffect(() => {
        if (!ready) return;
        if (reduced) { onDone(); return; }
        const timer = setTimeout(() => {
            const table = tableRef.current;
            if (!table) { onDone(); return; }
            const bounds = table.getBoundingClientRect();
            const groups = [...table.querySelectorAll('[data-deal-seat]')];
            const seats = (game === "BLACKJACK" ? [...groups].reverse() : groups).map(group => [...group.querySelectorAll('[data-playing-card]')]);
            const board = [...table.querySelectorAll('[data-deal-board] [data-playing-card]')].slice(0, 3);
            const order = [0, 1].flatMap(index => seats.map(cards => cards[index])).concat(board).filter(Boolean);
            setTargets(order.map(card => {
                const rect = card.getBoundingClientRect();
                return { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height };
            }));
            if (!order.length) onDone();
        }, 1200);
        return () => clearTimeout(timer);
    }, [ready, reduced, tableRef, onDone, game]);
    return <div className={styles.overlay} data-river-deal data-deal-game={game} aria-label="Shuffling and dealing cards" role="status">
        <div className={styles.deck} aria-hidden="true">
            {[0,1,2,3].map(index => <i key={index} style={{ transform: `translate(${index * 2}px, ${-index * 2}px)` }} />)}
            {!targets && [0,1].map(index => <motion.i key={`packet-${index}`} initial={false} animate={reduced ? {} : { x: [0, index ? 38 : -38, 0], y: [0, -16, -4], rotate: [0, index ? 12 : -12, 0] }} transition={{ duration: .6, repeat: Infinity, ease: "easeInOut" }} />)}
        </div>
        {targets?.map((target, index) => <motion.i className={styles.flyingCard} key={index} initial={{ left: "50%", top: "43%", width: 64, height: 90, x: -32, y: -45, rotate: -8, opacity: 0 }} animate={{ left: target.x, top: target.y, width: target.width, height: target.height, x: 0, y: 0, rotate: 0, opacity: 1 }} transition={{ duration: .38, delay: index * .22, ease: [.2,.7,.3,1] }} onAnimationComplete={index === targets.length - 1 ? onDone : undefined} aria-hidden="true" />)}
        <span className={styles.caption}>{targets ? "Dealing to each seat…" : "Shuffling the deck…"}</span>
    </div>;
}
