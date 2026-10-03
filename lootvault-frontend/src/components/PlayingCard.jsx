import styles from "./PlayingCard.module.css";

const SUITS = { HEARTS: "♥", DIAMONDS: "♦", CLUBS: "♣", SPADES: "♠" };
const RANKS = { 11: "J", 12: "Q", 13: "K", 14: "A" };
export default function PlayingCard({ card, index = 0 }) {
    const hidden = !card || card.suit === "BACK";
    const rank = hidden ? "" : RANKS[card.rank] || card.rank;
    const red = card?.suit === "HEARTS" || card?.suit === "DIAMONDS";
    return <div className={`${styles.card} ${hidden ? styles.back : ""} ${red ? styles.red : ""}`} style={{ "--deal-delay": `${index * 60}ms` }} role="img" aria-label={hidden ? "Face-down card" : `${rank} of ${card.suit.toLowerCase()}`}>
        {hidden ? <span className={styles.monogram}>LV</span> : <><span className={styles.corner}>{rank}<small>{SUITS[card.suit]}</small></span><span className={styles.suit}>{SUITS[card.suit]}</span><span className={styles.bottom}>{rank}</span></>}
    </div>;
}
