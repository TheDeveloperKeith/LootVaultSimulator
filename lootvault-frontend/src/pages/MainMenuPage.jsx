import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { getTodayGrant } from "../api/game";
import styles from "./MainMenuPage.module.css";
import { Link } from "react-router-dom";
import { getCollection, getQuests } from "../api/progression";
import progressionStyles from "./ProgressionPage.module.css";
import VaultIcon from "../components/VaultIcon";
import DailyCoinCrate from "../components/DailyCoinCrate";

export default function MainMenuPage() {
    const navigate = useNavigate();
    const [boxesRemaining, setBoxesRemaining] = useState(null); // null = still loading
    const [progression, setProgression] = useState(null);
    const [progressionError, setProgressionError] = useState(false);
    const [now] = useState(Date.now);

    useEffect(() => {
        Promise.all([getCollection(), getQuests()])
            .then(([collection, quests]) => setProgression({ collection, quests }))
            .catch(() => setProgressionError(true));
        getTodayGrant()
            .then((grant) => setBoxesRemaining(grant.boxesRemaining))
            .catch(() => setBoxesRemaining(null));
    }, []);

    return (
        <div className={styles.lobby}>
            <div className={styles.progression}><DailyCoinCrate /></div>
            <section className={`${progressionStyles.panel} ${styles.progression}`}>
                <span className={progressionStyles.eyebrow}>YOUR NEXT GOAL</span>
                <h2>Vault progression</h2>
                {progression ? <>
                    <strong>{progression.collection.collected} / {progression.collection.total} collected</strong>
                    <progress className={progressionStyles.meter} value={progression.collection.collected} max={progression.collection.total || 1} aria-label="Collection progress" />
                    <p>{progression.quests.filter(quest => quest.completed && !quest.claimed && new Date(quest.expiresAt).getTime() > now).length} quest rewards ready to claim</p>
                </> : <p>{progressionError ? "Couldn't load progression." : "Loading progression…"}</p>}
                <Link to="/progression">View collection & quests →</Link>
            </section>
            <section className={styles.promo}>
                <div className={styles.crate}><VaultIcon size={72} /></div>
                <div>
                    <h2 className={styles.promoTitle}>Daily loot boxes</h2>
                    <p className={styles.promoText}>
                        {boxesRemaining === null ? "Loading..." : `${boxesRemaining} left today`}
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => navigate("/lootboxes")}>
                        Open boxes
                    </Button>
                </div>
            </section>

            <section className={styles.play}>
                <p className={styles.mode}>Earn your loot!</p>
                <p className={styles.promoText}>Jack No Black or The River. Your coins, your call.</p>
                <Button size="lg" onClick={() => navigate("/earn")}>
                    Take a seat
                </Button>
                <Link to="/modes">Explore all modes →</Link>
            </section>
        </div>
    );
}
