import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { claimQuest, getCollection, getPity, getQuests } from "../api/progression";
import { RARITY_LABEL, RARITY_CLASS, RARITY_ORDER } from "../rarities";
import { useWallet } from "../wallet/WalletContext";
import Button from "../components/Button";
import PityMeter from "../components/PityMeter";
import { getEarnState } from "../api/earn";
import styles from "./ProgressionPage.module.css";

function resetLabel(expiresAt, now) {
    const milliseconds = new Date(expiresAt).getTime() - now;
    if (!Number.isFinite(milliseconds)) return "";
    if (milliseconds <= 0) return "Expired — refresh for new quests";
    const minutes = Math.ceil(milliseconds / 60000);
    return `Resets in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function ProgressionPage() {
    const [collection, setCollection] = useState(null);
    const [quests, setQuests] = useState(null);
    const [pity, setPity] = useState(null);
    const [earn, setEarn] = useState(null);
    const [errors, setErrors] = useState({});
    const [claiming, setClaiming] = useState(null);
    const [notice, setNotice] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [now, setNow] = useState(Date.now);
    const { refresh: refreshWallet } = useWallet();

    const load = useCallback(async () => {
        const results = await Promise.allSettled([getCollection(), getQuests(), getPity(), getEarnState()]);
        const nextErrors = {};
        results.forEach((result, index) => {
            const key = ["collection", "quests", "pity", "earn"][index];
            if (result.status === "fulfilled") [setCollection, setQuests, setPity, setEarn][index](result.value);
            else nextErrors[key] = result.reason.message || `Couldn't load ${key}.`;
        });
        setErrors(nextErrors);
    }, []);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => { if (active) return load(); });
        return () => { active = false; };
    }, [load]);
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(timer);
    }, []);

    async function handleClaim(quest) {
        setClaiming(quest.id);
        setNotice("");
        try {
            const updated = await claimQuest(quest.id);
            setQuests(previous => previous.map(item => item.id === quest.id ? updated : item));
            setNotice(`Claimed ${quest.rewardCoins.toLocaleString()} coins for ${quest.title}.`);
            await refreshWallet();
        } catch (error) {
            setNotice(error.message || "Couldn't claim this reward.");
        } finally { setClaiming(null); }
    }

    return <div className={styles.page}>
        <header className={styles.row}><div><span className={styles.eyebrow}>EVERY PULL COUNTS</span><h1>Progression</h1><p className={styles.dim}>Discover the catalog, complete quests, and build toward your next reward.</p></div><Button size="sm" variant="secondary" onClick={load}>Refresh</Button></header>
        <div className={styles.links}><Link to="/crates">Open crates →</Link><Link to="/inventory">Craft in inventory →</Link></div>
        <section className={styles.panel}><div className={styles.row}><div><span className={styles.eyebrow}>EARN YOUR LOOT</span><h2>Your table record</h2></div><Link to="/earn">Take a seat ↗</Link></div>
            {errors.earn ? <p role="alert">{errors.earn}</p> : earn ? <div className={styles.grid}>
                <div className={styles.tile}><strong>{earn.stats.handsPlayed.toLocaleString()}</strong><small>Hands finished</small></div>
                <div className={styles.tile}><strong>{earn.stats.wins.toLocaleString()}</strong><small>Hands won</small></div>
                <div className={styles.tile}><strong>{earn.stats.netCoins > 0 ? "+" : ""}{earn.stats.netCoins.toLocaleString()} coins</strong><small>Net table result · after stakes</small></div>
            </div> : <p>Loading your table record…</p>}
            <p className={styles.dim}>Claim daily coins, finish hands, and win at Jack No Black or The River to advance your card-table quests.</p>
        </section>
        <section className={styles.panel}>
            <h2>Permanent collection</h2>
            {errors.collection ? <p role="alert">{errors.collection}</p> : !collection ? <p>Loading collection…</p> : <>
                <div className={styles.row}><strong className={styles.total}>{collection.collected} / {collection.total} collected</strong><span>{collection.total ? Math.round(collection.collected / collection.total * 100) : 0}%</span></div>
                <progress className={styles.meter} value={collection.collected} max={collection.total || 1} aria-label="Overall collection" />
                <p className={styles.dim}>Discoveries stay collected after selling or crafting. Tier bonuses are awarded automatically.</p>
                <div className={styles.grid}>{[...RARITY_ORDER].reverse().map(rarity => {
                    const tier = collection.byRarity[rarity];
                    if (!tier) return null;
                    return <div key={rarity} className={styles.tile} style={{ "--accent": `var(--rarity-${RARITY_CLASS[rarity]}, #fdf100)` }}>
                        <div className={styles.row}><strong>{RARITY_LABEL[rarity]}</strong><span>{tier.collected} / {tier.total}</span></div>
                        <progress className={styles.meter} value={tier.collected} max={tier.total || 1} aria-label={`${RARITY_LABEL[rarity]} collection`} />
                        <small>{tier.rewardClaimed ? "✓ Completion bonus awarded" : tier.total === 0 ? "No catalog items" : "Complete this tier for a one-time bonus"}</small>
                    </div>;
                })}</div>
                <div className={styles.filters} aria-label="Collection rarity filter">{["ALL", ...RARITY_ORDER].map(rarity => <button key={rarity} aria-pressed={filter === rarity} onClick={() => setFilter(rarity)}>{RARITY_LABEL[rarity] || "All"}</button>)}</div>
                <ul className={styles.discoveries}>{collection.items.filter(item => filter === "ALL" || item.rarity === filter).map(item => <li key={item.itemCatalogId}><span>✓ {item.name}</span><small>{RARITY_LABEL[item.rarity] || item.rarity}</small></li>)}</ul>
                {!collection.items.some(item => filter === "ALL" || item.rarity === filter) && <p className={styles.dim}>No discoveries here yet. Open crates to start your collection.</p>}
            </>}
        </section>
        <section className={styles.panel}>
            <h2>Quests</h2><p role="status">{notice}</p>
            {errors.quests ? <p role="alert">{errors.quests}</p> : !quests ? <p>Loading quests…</p> : <div className={styles.columns}>{["DAILY", "WEEKLY"].map(period => <div key={period}><h3>{period === "DAILY" ? "Daily quests" : "Weekly quests"}</h3>
                {quests.filter(quest => quest.period === period).map(quest => <article className={styles.quest} key={quest.id}>
                    {/CARD|BLACKJACK|RIVER|COIN_CRATE/.test(quest.code) && <Link to="/earn" className={styles.eyebrow}>CARD TABLES ↗</Link>}
                    <div className={styles.row}><strong>{quest.title}</strong><span>{Math.min(quest.progress, quest.target)} / {quest.target}</span></div>
                    <progress className={styles.meter} value={Math.min(quest.progress, quest.target)} max={quest.target || 1} aria-label={quest.title} />
                    <small className={styles.dim}>{resetLabel(quest.expiresAt, now)}</small>
                    <div className={styles.row}><span className={styles.reward}>+{quest.rewardCoins.toLocaleString()} coins</span><Button size="sm" disabled={!quest.completed || quest.claimed || claiming !== null || new Date(quest.expiresAt).getTime() <= now} onClick={() => handleClaim(quest)}>{quest.claimed ? "Claimed ✓" : claiming === quest.id ? "Claiming…" : quest.completed ? "Claim reward" : "In progress"}</Button></div>
                </article>)}
                {!quests.some(quest => quest.period === period) && <p className={styles.dim}>No active quests.</p>}
            </div>)}</div>}
        </section>
        <section className={styles.panel}><h2>Crate pity</h2><p className={styles.dim}>Each crate pool builds progress toward its own guaranteed drop.</p>
            {errors.pity ? <p role="alert">{errors.pity}</p> : !pity ? <p>Loading pity…</p> : pity.length === 0 ? <p>Open your first crate to start building pity.</p> : <div className={styles.grid}>{pity.map(counter => <div className={styles.tile} key={counter.poolCode}><h3>{counter.poolCode.replaceAll("_", " ")}</h3><PityMeter counter={counter} /><small className={styles.dim}>{counter.totalPulls} lifetime pulls</small></div>)}</div>}
        </section>
    </div>;
}
