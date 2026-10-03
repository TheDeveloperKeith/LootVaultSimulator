import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { rollSandboxItem } from "../sandbox/roll";
import { fireConfetti } from "../sandbox/effects";
import { RARITY_LABEL, RARITY_ORDER, RARITY_WEIGHT } from "../sandbox/items";
import RarityBurst from "../components/RarityBurst";
import styles from "./SandboxPage.module.css";
import ItemIcon from "../components/ItemIcon";

const FEED_LIMIT = 18; // how many rows stay visible before old ones scroll off
const AUTO_OPEN_INTERVAL_MS = 130;
const BURST_HOLD_MS = 4900; // how long the full-screen effect stays up before it exits

const BURST_RARITIES = new Set(["EXOTIC", "EXTRAORDINARY"]);

function emptyCounts() {
  return RARITY_ORDER.reduce((acc, r) => ({ ...acc, [r]: 0 }), {});
}

export default function SandboxPage() {
  const [feed, setFeed] = useState([]);           // capped list, newest first — what's on screen
  const [counts, setCounts] = useState(emptyCounts()); // uncapped running totals — what the stats bar uses
  const [total, setTotal] = useState(0);
  const [autoOpen, setAutoOpen] = useState(false);
  const [burst, setBurst] = useState(null); // { rarity, key } — drives the full-screen effect

  const intervalRef = useRef(null);
  const nextKeyRef = useRef(0);
  const nextBurstKeyRef = useRef(0);

  const rollOne = useCallback(() => {
    const item = rollSandboxItem();
    const entry = { ...item, key: nextKeyRef.current++ };

    setFeed((prev) => [entry, ...prev].slice(0, FEED_LIMIT));
    setCounts((prev) => ({ ...prev, [item.rarity]: prev[item.rarity] + 1 }));
    setTotal((prev) => prev + 1);

    if (BURST_RARITIES.has(item.rarity)) {
      // New key each time so React swaps the overlay (exit + re-enter) even
      // if the same rarity hits twice in a row during auto-open, instead of
      // silently no-oping on an unchanged rarity value.
      setBurst({ rarity: item.rarity, itemName: item.name, itemType: item.type, key: nextBurstKeyRef.current++ });
      fireConfetti(item.rarity);
    }
  }, []);

  // Auto-dismiss the full-screen effect. Re-triggers correctly on every new
  // burst because `burst` is a new object each time (see setBurst above).
  useEffect(() => {
    if (!burst) return;
    const timer = setTimeout(() => setBurst(null), BURST_HOLD_MS);
    return () => clearTimeout(timer);
  }, [burst]);

  function rollMany(n) {
    for (let i = 0; i < n; i++) rollOne();
  }

  function toggleAutoOpen() {
    setAutoOpen((prev) => !prev);
  }

  // Auto-open loop: starts/stops cleanly with the toggle and on unmount,
  // so navigating away never leaves a timer running in the background.
  useEffect(() => {
    if (!autoOpen) return;
    intervalRef.current = setInterval(rollOne, AUTO_OPEN_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [autoOpen, rollOne]);

  function reset() {
    setAutoOpen(false);
    setFeed([]);
    setCounts(emptyCounts());
    setTotal(0);
  }

  return (
      <div className={styles.page}>
        <AnimatePresence>
          {burst && <RarityBurst key={burst.key} rarity={burst.rarity} itemName={burst.itemName} itemType={burst.itemType} />}
        </AnimatePresence>

        <div className={styles.head}>
          <h1 className={styles.title}>Sandbox Mode</h1>
          <p className={styles.sub}>
            Unlimited practice rolls. Nothing here spends currency or touches your real inventory.
          </p>
        </div>

        <div className={styles.controls}>
          <button className={styles.actionBtn} onClick={() => rollOne()}>
            Open 1
          </button>
          <button className={styles.actionBtn} onClick={() => rollMany(10)}>
            Open x10
          </button>
          <button
              className={autoOpen ? styles.actionBtnActive : styles.actionBtn}
              onClick={toggleAutoOpen}
          >
            {autoOpen ? "Stop auto-open" : "Auto-open"}
          </button>
          <button className={styles.resetBtn} onClick={reset}>
            Reset
          </button>
        </div>

        <div className={styles.layout}>
          {/* Live stats: running counts + how far they've drifted from the target odds */}
          <aside className={styles.stats}>
            <h2 className={styles.statsTitle}>Live odds ({total} opened)</h2>
            {RARITY_ORDER.map((rarity) => {
              const count = counts[rarity];
              const actualPct = total > 0 ? (count / total) * 100 : 0;
              const targetPct = RARITY_WEIGHT[rarity] * 100;
              return (
                  <div key={rarity} className={styles.statRow}>
                    <div className={styles.statLabelRow}>
                  <span className={`${styles.statLabel} ${styles[rarity.toLowerCase()]}`}>
                    {RARITY_LABEL[rarity]}
                  </span>
                      <span className={styles.statNums}>
                    {count} &middot; {actualPct.toFixed(1)}%{" "}
                        <span className={styles.statTarget}>(target {targetPct.toFixed(0)}%)</span>
                  </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                          className={`${styles.barFill} ${styles[rarity.toLowerCase()]}`}
                          style={{ width: `${Math.min(actualPct, 100)}%` }}
                      />
                    </div>
                  </div>
              );
            })}
          </aside>

          {/* The feed: newest pull animates in at the top and pushes everything else down */}
          <section className={styles.feedPanel}>
            <h2 className={styles.feedTitle}>Drop feed</h2>
            <ul className={styles.feed}>
              <AnimatePresence initial={false}>
                {feed.map((entry) => (
                    <motion.li
                        key={entry.key}
                        layout
                        initial={{ opacity: 0, y: -24, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.22 }}
                        className={`${styles.feedItem} ${styles[entry.rarity.toLowerCase()]}`}
                    >
                  <span className={styles.feedIcon} aria-hidden="true">
                    <ItemIcon name={entry.name} type={entry.type} size={30} />
                  </span>
                      <span className={styles.feedName}>{entry.name}</span>
                      <span className={styles.feedRarity}>{RARITY_LABEL[entry.rarity]}</span>
                    </motion.li>
                ))}
              </AnimatePresence>
              {feed.length === 0 && (
                  <li className={styles.feedEmpty}>Nothing opened yet — try "Open 1" above.</li>
              )}
            </ul>
          </section>
        </div>
      </div>
  );
}

