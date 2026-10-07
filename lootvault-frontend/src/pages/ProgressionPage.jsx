import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { claimQuest, getCollection, getQuests } from "../api/progression";
import { RARITY_LABEL, RARITY_ORDER } from "../rarities";
import { useWallet } from "../wallet/WalletContext";
import PagedGrid from "../components/PagedGrid";
import Button from "../components/Button";
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
    const [questPeriod,setQuestPeriod]=useState("DAILY");
    const [view, setView] = useState("quests");
    const [collectionView, setCollectionView] = useState("tiers");
    const [collection, setCollection] = useState(null);
    const [quests, setQuests] = useState(null);
    const [earn, setEarn] = useState(null);
    const [errors, setErrors] = useState({});
    const [claiming, setClaiming] = useState(null);
    const [notice, setNotice] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [now, setNow] = useState(Date.now);
    const { refresh: refreshWallet } = useWallet();

    const load = useCallback(async () => {
        const results = await Promise.allSettled([getCollection(), getQuests(), getEarnState()]);
        const nextErrors = {};
        results.forEach((result, index) => {
            const key = ["collection", "quests", "earn"][index];
            if (result.status === "fulfilled") [setCollection, setQuests, setEarn][index](result.value);
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
        <header className={styles.row} data-page-header="true"><div><span className={styles.eyebrow}>EVERY PULL COUNTS</span><h1>Progression</h1><p className={styles.dim}>Discover the catalog, complete quests, and build toward your next reward.</p></div><Button size="sm" variant="secondary" onClick={load}>Refresh</Button></header>
        <div className={styles.filters} aria-label="Progression sections">{["quests", "collection", "record"].map(section => <button key={section} aria-pressed={view === section} onClick={() => setView(section)}>{section === "record" ? "Table record" : section === "collection" ? "Collection" : "Quests"}</button>)}</div>
        <div className={styles.links}><Link to="/crates">Open crates →</Link><Link to="/inventory">View inventory →</Link></div>
        {view === "record" && <section className={`${styles.panel} ${styles.recordBoard}`}><div className={styles.row}><div><span className={styles.eyebrow}>EARN YOUR LOOT</span><h2>Your table record</h2></div><Link to="/earn">Take a seat ↗</Link></div>
            {errors.earn ? <p role="alert">{errors.earn}</p> : earn ? <div className={styles.grid}>
                <div className={styles.tile}><strong>{earn.stats.handsPlayed.toLocaleString()}</strong><small>Hands finished</small></div>
                <div className={styles.tile}><strong>{earn.stats.wins.toLocaleString()}</strong><small>Hands won</small></div>
                <div className={styles.tile}><strong>{earn.stats.netCoins > 0 ? "+" : ""}{earn.stats.netCoins.toLocaleString()} coins</strong><small>Net table result · after stakes</small></div>
            </div> : <p>Loading your table record…</p>}
            <p className={styles.dim}>Claim daily coins and finish hands to advance your quests. Wins are optional.</p>
        </section>}
        {view === "collection" && <section className={styles.panel}>
            <h2>Permanent collection</h2>
            {errors.collection ? <p role="alert">{errors.collection}</p> : !collection ? <p>Loading collection…</p> : <>
                <div className={styles.row}><strong className={styles.total}>{collection.collected} / {collection.total} collected</strong><span>{collection.total ? Math.round(collection.collected / collection.total * 100) : 0}%</span></div>
                <progress className={styles.meter} value={collection.collected} max={collection.total || 1} aria-label="Overall collection" />
                <p className={styles.dim}>Discoveries stay collected after selling. Tier bonuses are awarded automatically.</p>
                <div className={styles.filters}><button aria-pressed={collectionView === "tiers"} onClick={() => setCollectionView("tiers")}>Rarity tiers</button><button aria-pressed={collectionView === "items"} onClick={() => setCollectionView("items")}>Discoveries</button>{collectionView === "items" && <label>Rarity <select value={filter} onChange={event => setFilter(event.target.value)}>{["ALL", ...RARITY_ORDER].map(rarity => <option key={rarity} value={rarity}>{RARITY_LABEL[rarity] || "All"}</option>)}</select></label>}</div>
                {collectionView === "tiers" ? <PagedGrid key="tiers" items={[...RARITY_ORDER].reverse().filter(rarity => collection.byRarity[rarity])} label="Collection tiers" minHeight={95} maxColumns={1} renderItem={rarity => {
                    const tier = collection.byRarity[rarity];
                    return <li key={rarity} className={styles.tile}><strong>{RARITY_LABEL[rarity]}</strong><span>{tier.collected} / {tier.total}</span><progress className={styles.meter} value={tier.collected} max={tier.total || 1} aria-label={`${RARITY_LABEL[rarity]} collection`} /><small>{tier.rewardClaimed ? "Completion bonus awarded" : "Complete this tier for a one-time bonus"}</small></li>;
                }} /> : <PagedGrid key={`discoveries-${filter}`} items={collection.items.filter(item => filter === "ALL" || item.rarity === filter)} label="Discoveries" minHeight={80} maxColumns={1} renderItem={item => <li key={item.itemCatalogId} className={styles.tile}><strong>✓ {item.name}</strong><small>{RARITY_LABEL[item.rarity] || item.rarity}</small></li>} />}
            </>}
        </section>}
        {view === "quests" && <section className={`${styles.panel} ${styles.questBoard}`}>
            <aside className={styles.questCategories}><h2>YOUR MISSIONS</h2>{[["DAILY","Daily quests","Fresh goals, every day","✦"],["WEEKLY","Weekly quests","Build your momentum","♜"]].map(([id,title,subtitle,icon])=><button key={id} aria-pressed={questPeriod===id} onClick={()=>setQuestPeriod(id)}><span><strong>{title}</strong><small>{subtitle}</small></span><b aria-hidden="true">{icon}</b></button>)}<p>Play at your own pace. Every completed mission moves your vault forward.</p></aside>
            <div className={styles.questList}><h2>{questPeriod === "DAILY" ? "DAILY" : "WEEKLY"} QUESTS</h2><p role="status" className={styles.questNotice}>{notice}</p>
            {errors.quests ? <p role="alert">{errors.quests}</p> : !quests ? <p>Loading quests…</p> : <PagedGrid key={questPeriod} items={quests.filter(quest=>quest.period===questPeriod)} label="Quests" minHeight={90} maxColumns={1} renderItem={quest => <li className={`${styles.quest} ${quest.completed ? styles.questComplete : ""}`} key={quest.id}>
                <div className={styles.mission}><strong>{quest.title}</strong><div className={styles.row}><small>{resetLabel(quest.expiresAt, now)}</small><span>{Math.min(quest.progress, quest.target)} / {quest.target}</span></div><progress className={styles.meter} value={Math.min(quest.progress, quest.target)} max={quest.target || 1} aria-label={quest.title}/></div>
                <div className={styles.prize}><span aria-hidden="true">✦</span><strong>+{quest.rewardCoins.toLocaleString()}</strong><small>COINS</small><Button size="sm" disabled={!quest.completed || quest.claimed || claiming !== null || new Date(quest.expiresAt).getTime() <= now} onClick={() => handleClaim(quest)}>{quest.claimed ? "Claimed ✓" : claiming === quest.id ? "Claiming…" : quest.completed ? "Claim" : "In progress"}</Button></div>
            </li>} />}</div>
        </section>}
    </div>;
}
