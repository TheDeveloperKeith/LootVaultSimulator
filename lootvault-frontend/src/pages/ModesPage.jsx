import { Link } from "react-router-dom";
import styles from "./ModesPage.module.css";
import ModeIcon from "../components/ModeIcon";

// Sandbox, Banners, and Normal Crate Mode are live (Banners is a "coming
// soon" teaser page, not the real mode yet). The rest are ideas from the
// roadmap, shown locked so the page reads as a real menu rather than a
// dead end.
const MODES = [
    { to: "/earn", title: "Earn your loot!", blurb: "Jack No Black or The River. Commit coins, face the table, and build your vault.", locked: false },
    { to: "/sandbox", title: "Sandbox", blurb: "Unlimited practice rolls with a live drop feed. No cost, no risk.", locked: false },
    { to: "/banners", title: "Banners", blurb: "Limited-time item pools with a pity timer. Sneak peek available now.", locked: false },
    { to: "/crates", title: "Normal Crates", blurb: "Buy crates with coins, open them for real items, sell what you don't want.", locked: false },
    { to: "/progression", title: "Collection & quests", blurb: "Track discoveries and claim rewards for daily and weekly goals.", locked: false },
    { to: "/inventory", title: "Crafting", blurb: "Select five items of one rarity to prepare an upgrade.", locked: false },
];

export default function ModesPage() {

    return (
        <div className={styles.page}>
            <div className={styles.head}>
                <h1 className={styles.title}>Modes</h1>
                <p className={styles.sub}>Pick how you want to play.</p>
            </div>

            <ul className={styles.grid}>
                {MODES.map((mode) => (
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
