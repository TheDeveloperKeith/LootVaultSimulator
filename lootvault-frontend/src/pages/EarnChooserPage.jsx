import typography from "./EarnTypography.module.css";
import coolStyles from "./CoolLoot.module.css";
import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-500.css";
import "@fontsource/roboto/latin-700.css";
import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { getEarnState } from "../api/earn";
import styles from "./EarnChooserPage.module.css";

const games = [
    { id: "BLACKJACK", path: "blackjack", name: "Jack No Black", symbol: "♠", description: "You against the dealer. Hit or stand to get as close to 21 as you can.", detail: "Blackjack · 2 seats" },
    { id: "HOLDEM", path: "river", name: "The River", symbol: "♥", description: "Face Nova and Atlas. Read five community cards and play your best poker hand.", detail: "Hold’em · 3 seats" },
];

export default function EarnChooserPage() {
    const [params] = useSearchParams();
    const [saved, setSaved] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        let alive = true;
        getEarnState().then(state => { if (alive) setSaved(state.round?.stage !== "COMPLETE" ? state.round : null); })
            .catch(() => { if (alive) setError("Couldn't check your saved hand. You can still open a table to retry."); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);
    const legacyGame = params.get("game");
    if (legacyGame === "HOLDEM" || legacyGame === "BLACKJACK") return <Navigate replace to={`/earn/${legacyGame === "HOLDEM" ? "river" : "blackjack"}`} />;
    return <main className={`${styles.page} ${coolStyles.page} ${typography.page}`}>
        <header><span className={styles.eyebrow}>Earn your loot</span><h1>Choose your table</h1><p>Take a seat. Your game opens in its own screen with room to read every card.</p></header>
        {error && <p role="status">{error}</p>}
        {saved && <p className={styles.saved} role="status">Your {saved.game === "HOLDEM" ? "River" : "Blackjack"} hand is saved. Resume it before starting another game.</p>}
        <div className={styles.games}>{games.map(game => {
            const unavailable = loading || Boolean(saved && saved.game !== game.id);
            const content = <><span className={styles.symbol} aria-hidden="true">{game.symbol}</span><small>{game.detail}</small><h2>{game.name}</h2><p>{game.description}</p><strong>{loading ? "Checking your seat…" : unavailable ? "Finish your saved hand first" : saved ? "Resume your hand →" : "Take a seat →"}</strong></>;
            return unavailable ? <div key={game.id} className={styles.game} aria-disabled="true">{content}</div> : <Link key={game.id} className={styles.game} to={`/earn/${game.path}`}>{content}</Link>;
        })}</div>
        <p className={styles.note}>In-game coins or gems only. Every stake can be lost. Leaving a table saves your current hand.</p>
    </main>;
}
