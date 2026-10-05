import { useEffect, useState } from "react";
import { api } from "../api/client";
import { RARITY_LABEL } from "../rarities";
import Button from "../components/Button";
import { ApiError } from "../api/client";
import { getTodayGrant, openLootBox } from "../api/game";
import styles from "./LootBoxPage.module.css";
import VaultIcon from "../components/VaultIcon";
import DailyCoinCrate from "../components/DailyCoinCrate";

const RARITY_CLASS = { COMMON: "common", BASIC: "basic", EXCELLENT: "excellent", EXOTIC: "exotic", EXTRAORDINARY: "extraordinary" };

export default function LootBoxPage() {
  const [odds, setOdds] = useState(null);
  const [grant, setGrant] = useState(null);   // { boxesGranted, boxesOpened, boxesRemaining }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opening, setOpening] = useState(false);
  const [lastResult, setLastResult] = useState(null); // most recently opened InventoryItemResponse

  useEffect(() => {
    api.get("/api/lootboxes/odds").then(setOdds).catch(() => {});
    getTodayGrant()
        .then(setGrant)
        .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load today's boxes."))
        .finally(() => setLoading(false));
  }, []);

  async function handleOpen() {
    setOpening(true);
    setError(null);
    try {
      const item = await openLootBox();
      setLastResult(item);
      // Re-sync the count from the server rather than guessing the new
      // value locally, so it can never drift from what the backend has.
      setGrant(await getTodayGrant());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't open the box.");
    } finally {
      setOpening(false);
    }
  }

  if (loading) return <p>Loading today's boxes...</p>;
  if (error && !grant) return <p className={styles.errorText}>{error}</p>;

  const canOpen = grant.boxesRemaining > 0 && !opening;

  return (
      <div className={styles.page}>
        <div className={styles.dailyCoins}><DailyCoinCrate /></div>
        <details style={{marginBottom:"1.5rem"}}><summary>Daily box odds</summary>{odds ? <ul>{Object.entries(odds).map(([rarity, chance]) => <li key={rarity}>{RARITY_LABEL[rarity] || rarity}: {chance.toFixed(2)}%</li>)}</ul> : <p>Odds are unavailable right now. You can wait before opening.</p>}<p>Each roll is independent. Daily boxes have no pity guarantee.</p></details>
        <section className={styles.board}>
          <div className={styles.head}>
            <div className={styles.streak}>
              <span className={styles.streakLabel}>Today</span>
              <span className={styles.streakNum}>{grant.boxesRemaining}</span>
            </div>
            <div className={styles.headCenter}>
              <h1 className={styles.title}>Daily loot</h1>
              <p className={styles.sub}>
                {grant.boxesOpened} / {grant.boxesGranted} opened today
              </p>
            </div>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.openArea}>
            <div className={`${styles.crateArt} ${canOpen ? "" : styles.crateEmpty}`} aria-hidden="true">
              <VaultIcon size={72} />
            </div>
            <Button size="lg" disabled={!canOpen} onClick={handleOpen}>
              {opening ? "Opening..." : canOpen ? "Open a box" : "No boxes left today"}
            </Button>
          </div>
        </section>

        <aside className={styles.detail}>
          {lastResult ? (
              <>
                <p className={styles.detailKind}>
                  {RARITY_LABEL[lastResult.rarity] ?? lastResult.rarity} item
                </p>
                <h2 className={`${styles.detailName} ${styles[RARITY_CLASS[lastResult.rarity]] ?? ""}`}>
                  {lastResult.itemName}
                </h2>
                <p className={styles.detailText}>Added to your inventory.</p>
              </>
          ) : (
              <p className={styles.detailText}>Open a box to see what you get.</p>
          )}
        </aside>
      </div>
  );
}
