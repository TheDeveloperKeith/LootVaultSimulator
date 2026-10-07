import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { RARITY_LABEL } from "../rarities";
import { ApiError } from "../api/client";
import { getTodayGrant, openLootBox } from "../api/game";
import styles from "./LootBoxPage.module.css";
import MerchantPortrait from "../components/MerchantPortrait";
import CrateIcon from "../components/CrateIcon";
import ScreenDialog from "../components/ScreenDialog";
import DailyCoinCrate from "../components/DailyCoinCrate";


export default function LootBoxPage() {
  const dialogueHeading = useRef(null);
  const [loadAttempt,setLoadAttempt] = useState(0);
  const [choice, setChoice] = useState(null);
  const [showOdds, setShowOdds] = useState(false);
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
        .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load today's crates."))
        .finally(() => setLoading(false));
  }, [loadAttempt]);
  useEffect(() => { dialogueHeading.current?.focus({preventScroll:true}); }, [choice]);

  async function handleOpen() {
    setOpening(true);
    setError(null);
    try {
      const item = await openLootBox();
      setLastResult(item);
      window.dispatchEvent(new CustomEvent("lootvault:crate-notification", {detail:{title:"Daily delivery opened",message:item.itemName,code:"COMMON",target:"/inventory"}}));
      // Re-sync the count from the server rather than guessing the new
      // value locally, so it can never drift from what the backend has.
      setGrant(await getTodayGrant());
      window.dispatchEvent(new Event("lootvault:daily-changed"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't open the crate.");
    } finally {
      setOpening(false);
    }
  }

  if (loading) return <p role="status">Loading today's crates...</p>;
  if (error && !grant) return <div><p role="alert">{error}</p><button onClick={() => { setLoading(true); setError(null); setLoadAttempt(value => value + 1); }}>Try again</button></div>;

  const canOpen = grant.boxesRemaining > 0 && !opening;

  return <section className={styles.page}>
    {showOdds && <ScreenDialog title="Daily crate odds" onClose={() => setShowOdds(false)}>{odds ? <ul>{Object.entries(odds).map(([rarity, chance]) => <li key={rarity}>{RARITY_LABEL[rarity] || rarity}: {chance.toFixed(2)}%</li>)}</ul> : <p>Odds are unavailable. You can wait before opening.</p>}<p>Each roll is independent. Daily crates have no pity guarantee.</p></ScreenDialog>}
    <div className={styles.landscape} aria-hidden="true"><div className={styles.moon}/><div className={styles.hills}/><div className={styles.path}/></div>
    <header className={styles.sign} data-page-header="true"><small>A REST STOP ON YOUR JOURNEY</small><h1>Milo’s Trading Post</h1><span>Daily provisions · always on the house</span></header>
    <div className={styles.visit}>
      <div className={styles.stall}><div className={styles.awning}/><div className={styles.lantern} aria-hidden="true">✦</div><div className={styles.merchant}><MerchantPortrait size={240}/></div><div className={styles.counter}><span>MILO</span><small>Relics, supplies & a little good fortune</small></div><div className={styles.shelf} aria-hidden="true"><CrateIcon code="BASIC" size={55}/><CrateIcon code="EXCELLENT" size={45}/><span>✦</span></div></div>
      <section className={styles.dialogue} aria-label="Talk to Milo"><small>MILO · MERCHANT</small><h2 ref={dialogueHeading} tabIndex={-1}>{choice === "crates" ? "A little mystery for the road?" : choice === "coins" ? "Every journey needs a few coins." : "Welcome, traveler. What do you need?"}</h2>
        {!choice ? <><p>Rest a moment. I’ve kept your daily supplies safe.</p><div className={styles.choices}><button onClick={() => setChoice("crates")}><CrateIcon size={42}/><span>“My daily crates, please.”<small>{grant.boxesRemaining} waiting for you</small></span><b>↗</b></button><button onClick={() => setChoice("coins")}><span className={styles.coin} aria-hidden="true">✦</span><span>“I’m here for my daily coins.”<small>A little help for the next hand</small></span><b>↗</b></button></div></> : <>
          {choice === "crates" ? <div className={styles.reward}><button className={styles.claim} disabled={!canOpen} onClick={handleOpen}><CrateIcon size={90}/><span>{opening ? "Opening…" : canOpen ? "Receive a daily crate" : "All delivered for today"}<small>{grant.boxesRemaining} of {grant.boxesGranted} remaining</small></span></button><button className={styles.odds} onClick={() => setShowOdds(true)}>See crate odds</button>{lastResult && <p role="status" className={styles.result}>“A fine find!” <strong>{lastResult.itemName}</strong> · {RARITY_LABEL[lastResult.rarity]}<small>Added to your inventory.</small></p>}</div> : <DailyCoinCrate/>}
          <button className={styles.back} onClick={() => setChoice(null)}>← “What else do you have?”</button>
        </>}
        {error && <p role="alert" className={styles.errorText}>{error}</p>}
      </section>
    </div>
  </section>;
}
