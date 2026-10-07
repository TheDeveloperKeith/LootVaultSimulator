import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import styles from "./MainMenuPage.module.css";
import { Link } from "react-router-dom";
import { getCollection, getQuests } from "../api/progression";
import ExclusiveShop from "../components/ExclusiveShop";
import ItemIcon from "../components/ItemIcon";

export default function MainMenuPage() {
    const [showShop,setShowShop] = useState(false);
    const [rewardView, setRewardView] = useState("banner");
    const navigate = useNavigate();
    const [progression, setProgression] = useState(null);
    const [progressionError, setProgressionError] = useState(false);
    const [now] = useState(Date.now);

    useEffect(() => {
        Promise.all([getCollection(), getQuests()])
            .then(([collection, quests]) => setProgression({ collection, quests }))
            .catch(() => setProgressionError(true));
    }, []);

    return <div className={styles.lobby}>
        {showShop && <ExclusiveShop onClose={()=>setShowShop(false)}/>}
        <header className={styles.lobbyHead} data-page-header="true"><div><span className={styles.eyebrow}>WELCOME TO YOUR VAULT</span><h1>The lobby</h1></div><div><button onClick={()=>setShowShop(true)}>Exclusive Shop</button> <button onClick={()=>window.dispatchEvent(new Event("lootvault:show-daily"))}>Daily rewards</button> <Link to="/inventory">Visit your vault</Link></div></header>
        <div className={styles.lobbyBody}>
            <section className={styles.play}>
                <span className={styles.eyebrow}>THE CARD TABLES</span><h2>Your next move.</h2>
                <p>Take a seat at The River or Jack No Black. Learn the table, enjoy the moment.</p>
                <div className={styles.tableArt} aria-hidden="true"><span>LV</span><span>♠</span><span>♥</span></div>
                <div className={styles.selections}><Button size="lg" onClick={() => navigate("/earn?game=HOLDEM")}>The River <small>Poker · 3 seats</small></Button><Button size="lg" variant="secondary" onClick={() => navigate("/earn?game=BLACKJACK")}>Jack No Black <small>You vs. dealer</small></Button></div><Link to="/modes">Explore modes ↗</Link>
            </section>
            <div className={styles.rewardZone}><nav className={styles.rewardTabs} aria-label="Lobby rewards">{[["banner","Featured"],["collection","Collection"]].map(([id,label]) => <button key={id} aria-pressed={rewardView === id} onClick={() => setRewardView(id)}>{label}</button>)}</nav><div className={styles.rewards} data-reward={rewardView}>
                <section className={styles.bannerFeature}><div><span className={styles.eyebrow}>FEATURED BANNER · LIMITED TIME</span><h2>Skybound Oath.</h2><p>Three featured relics. One sealed secret. Explore the gallery and reward odds.</p><Link to="/banners">Explore banner ↗</Link></div><div className={styles.bannerArt} aria-hidden="true"><ItemIcon name="Sunbreak Oathblade" size={95}/><ItemIcon name="Stormheart Katana" size={80}/><ItemIcon name="Astral Bastion" size={85}/><span>✦</span></div></section>

                <section className={styles.progression}><span className={styles.eyebrow}>YOUR COLLECTION</span>{progression ? <><strong>{progression.collection.collected} / {progression.collection.total} discovered</strong><progress value={progression.collection.collected} max={progression.collection.total || 1} aria-label="Collection progress"/><small>{progression.quests.filter(q => q.completed && !q.claimed && new Date(q.expiresAt).getTime() > now).length} quest rewards ready</small></> : <p>{progressionError ? "Progression unavailable." : "Loading progression…"}</p>}<Link to="/progression">Your quests & collection</Link></section>
            </div></div>
        </div>
    </div>;
}
