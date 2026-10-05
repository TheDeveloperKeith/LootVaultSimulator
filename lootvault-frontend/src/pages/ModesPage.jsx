import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ModesPage.module.css";
import ModeIcon from "../components/ModeIcon";

const MODES = [
    { to: "/earn", title: "Earn your loot!", blurb: "Jack No Black or The River. Commit coins, face the table, and build your vault.", locked: false },
    { to: "/sandbox", title: "Sandbox", blurb: "Unlimited practice rolls with a live drop feed. No cost, no risk.", locked: false },
    { to: "/crates", title: "Normal Crates", blurb: "Buy crates with coins, open them for real items, sell what you don't want.", locked: false },
    { to: "/progression", title: "Collection & quests", blurb: "Track discoveries and claim rewards for daily and weekly goals.", locked: false },
    { to: "/inventory", title: "Inventory", blurb: "Keep what you love and sell items you no longer need.", locked: false },
];

export default function ModesPage() {

    const [extra, setExtra] = useState(false);
    const visible = MODES.filter(mode => extra ? !["/earn","/crates"].includes(mode.to) : ["/earn","/crates"].includes(mode.to));
    return (
        <div className={styles.page}>
            <div className={styles.head}>
                <h1 className={styles.title}>Modes</h1>
                <p className={styles.sub}>Your next adventure starts here. Play, discover, and build something you love.</p>
            </div>

            <div className={styles.tabs} aria-label="Mode categories"><button aria-pressed={!extra} onClick={() => setExtra(false)}>Featured modes</button><button aria-pressed={extra} onClick={() => setExtra(true)}>Extra modes</button></div>
            <ul className={styles.grid}>
                {visible.map((mode) => (
                    <li key={mode.title}>
                      <Link to={mode.to} className={styles.card}>
                        <span className={styles.modeIcon}><ModeIcon mode={mode.to === "/earn" ? "earn" : mode.to === "/inventory" ? "crafting" : mode.to.slice(1)} /></span>
                        <h2 className={styles.cardTitle}>{mode.title}</h2>
                        <p className={styles.cardBlurb}>{mode.blurb}</p>
                        <span className={styles.cardTag}>Explore <span aria-hidden="true">↗</span></span>
                      </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
