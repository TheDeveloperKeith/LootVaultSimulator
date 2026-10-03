import { motion } from "framer-motion";
import MysteryChest from "../components/MysteryChest";
import { RARITY_WEIGHT } from "../sandbox/items";
import styles from "./BannerModePage.module.css";

// Flavor-only display names for this teaser page. "Legendary" here is the
// same tier stored as EXTRAORDINARY everywhere else in the app — kept as
// "Extraordinary" on the real Shop/Inventory screens, but shown as
// "Legendary" here purely for hype copy, same as the crate/gold framing
// this tier has always had.
const PODIUM = [
    { place: 2, key: "EXTRAORDINARY", label: "Legendary", pct: `${(RARITY_WEIGHT.EXTRAORDINARY * 100).toFixed(0)}%`, heightClass: "tall2" },
    { place: 1, key: "MYSTERY", label: "????", pct: "????", heightClass: "tall1" },
    { place: 3, key: "EXOTIC", label: "Exotic", pct: `${(RARITY_WEIGHT.EXOTIC * 100).toFixed(0)}%`, heightClass: "tall3" },
];

export default function BannerModePage() {
    return (
        <div className={styles.page}>
            <motion.div
                className={styles.ribbon}
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 16 }}
            >
                Coming Soon
            </motion.div>

            <h1 className={styles.title}>Banners</h1>
            <p className={styles.sub}>
                Limited-time gacha banners are on the way. Here's what's on the podium.
            </p>

            <div className={styles.podium}>
                {PODIUM.map((slot) => (
                    <div key={slot.key} className={`${styles.column} ${styles[slot.heightClass]}`}>
                        <div className={`${styles.figureWrap} ${slot.key === "MYSTERY" ? styles.mysteryGlow : styles[slot.key.toLowerCase()]}`}>
                            <div className={styles.silhouette} aria-hidden="true" />
                        </div>
                        <div className={styles.pedestal}>
                            <span className={styles.rank}>{slot.place}</span>
                            <span className={styles.slotLabel}>{slot.label}</span>
                            <span className={styles.slotPct}>{slot.pct}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.peekSection}>
                <h2 className={styles.peekTitle}>Get an early look</h2>
                <MysteryChest />
            </div>
        </div>
    );
}
