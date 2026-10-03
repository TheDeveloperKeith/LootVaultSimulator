import { useEffect, useState } from "react";
import { claimDailyCoins, getEarnState } from "../api/earn";
import { useWallet } from "../wallet/WalletContext";
import Button from "./Button";
import VaultIcon from "./VaultIcon";
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
    return <section className={`${styles.crate} ${opened ? styles.opened : ""}`} aria-label="Daily coin crate">
        <div className={styles.icon}><VaultIcon size={36} /></div>
        <div className={styles.copy}><span className={styles.eyebrow}>A FRESH START, EVERY DAY</span><h2>Daily coin crate</h2><p>{daily ? `${daily.coins.toLocaleString()} coins · alongside your 3 daily lootboxes` : "Loading your daily coins…"}</p>
            {daily?.claimed && <small>Next crate: {new Date(daily.resetsAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small>}
            {error && <p role="alert" className={styles.error}>{error}</p>}
            {opened && <p className={styles.success} role="status">+{daily?.coins.toLocaleString()} coins added to your wallet</p>}
        </div>
        <Button disabled={!daily || daily.claimed || busy} onClick={claim} size="sm">{busy ? "Opening…" : daily?.claimed ? "Claimed ✓" : "Open coin crate"}</Button>
    </section>;
}
