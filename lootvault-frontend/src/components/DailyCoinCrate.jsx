import { useEffect, useState } from "react";
import { claimDailyCoins, getEarnState } from "../api/earn";
import { useWallet } from "../wallet/WalletContext";
import styles from "./DailyCoinCrate.module.css";

export default function DailyCoinCrate() {
    const [daily, setDaily] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [opened, setOpened] = useState(false);
    const { refresh } = useWallet();
    useEffect(() => { getEarnState().then(data => setDaily(data.daily)).catch(error => setError(error.message)); }, []);
    async function claim() {
        setBusy(true); setError("");
        try {
            const data = await claimDailyCoins();
            setDaily(data.daily); setOpened(true); await refresh();
        } catch (error) { setError(error.message || "Couldn't open your coin crate."); }
        finally { setBusy(false); }
    }
    return <section className={`${styles.crate} ${styles.iconReward} ${opened ? styles.opened : ""}`} aria-label="Daily coin crate">
        <button className={styles.coinAction} disabled={!daily || daily.claimed || busy} onClick={claim} aria-label={daily?.claimed ? "Daily coins claimed" : `Claim ${daily?.coins || "daily"} coins`}><svg viewBox="0 0 120 120" width="110" height="110" aria-hidden="true"><defs><linearGradient id="daily-gold" x2="1" y2="1"><stop stopColor="#fff0af"/><stop offset="1" stopColor="#bf873f"/></linearGradient></defs><circle cx="60" cy="60" r="50" fill="url(#daily-gold)" stroke="#f3dc9f" strokeWidth="3"/><circle cx="60" cy="60" r="39" fill="none" stroke="#8f652d" strokeWidth="2"/><path d="M60 26 68 47 91 48 73 63 79 86 60 73 41 86 47 63 29 48 52 47Z" fill="#fff2bc" stroke="#a77b38" strokeWidth="2"/></svg><strong>{busy ? "Collecting…" : daily?.claimed ? "Claimed ✓" : daily ? `+${daily.coins.toLocaleString()} coins` : "Daily coins"}</strong><span>{daily?.claimed ? "See you tomorrow" : "Tap to collect"}</span></button>
        {daily?.claimed && <small className={styles.reset}>Resets {new Date(daily.resetsAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</small>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {opened && <p className={styles.success} role="status">Coins added to your wallet</p>}
    </section>;
}
