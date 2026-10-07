import ExclusiveShop from "../components/ExclusiveShop";
import GemIcon from "../components/GemIcon";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useWallet } from "../wallet/WalletContext";
import ItemIcon from "../components/ItemIcon";
import OpeningResults from "../components/OpeningResults";
import CrateOpenOverlay from "../components/CrateOpenOverlay";
import ScreenDialog from "../components/ScreenDialog";
import { resolveItemDesign } from "../items/designs";
import RarityBurst from "../components/RarityBurst";
import { RARITY_LABEL } from "../rarities";
import styles from "./BannerModePage.module.css";

export default function BannerModePage() {
  const [banners, setBanners] = useState(null);
  const [loadAttempt,setLoadAttempt] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const [single, setSingle] = useState(null);
  const [scene, setScene] = useState(null);
  const [showShop,setShowShop]=useState(false);
  const [showPool, setShowPool] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [pending, setPending] = useState(null);
  const { wallet, gems, refresh } = useWallet();
  useEffect(() => {
    let alive = true;
    api.get("/api/banners").then(data => { if (alive) setBanners(data); }).catch(err => { if (alive) { setError(err.message); setBanners([]); } });
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => { alive = false; clearInterval(timer); };
  }, [loadAttempt,gems?.multiplier,gems?.rollsRemaining]);
  const banner = banners?.find(entry => entry.active && now >= new Date(entry.startsAt).getTime() && now < new Date(entry.endsAt).getTime()) || banners?.[0];
  const active = banner?.active && now >= new Date(banner.startsAt).getTime() && now < new Date(banner.endsAt).getTime();
  const featured = banner?.rewards.filter(item => item.limited && !item.secret) || [];
  const showcase = [...featured, ...(banner?.rewards.filter(item => !item.limited && !item.secret).sort((a, b) => b.chance - a.chance) || [])].slice(0, 6);
  const secret = banner?.rewards.find(item => item.secret);
  function preview(itemName) { setScene({ key: crypto.randomUUID(), itemName, rarity: "EXTRA_EXTRAORDINARY" }); }
  async function pull(count) {
    if (busy) return;
    const request = pending || { requestId: crypto.randomUUID(), count };
    setPending(request); setBusy(true); setError("");
    try {
      const items = await api.post(`/api/banners/${banner.code}/pull`, request);
      setPending(null);
      if (items.length === 1) setSingle(items[0]);
      else {
        setResults(items);
        const mythic = items.find(item => resolveItemDesign(item.itemName).effect);
        if (mythic) setScene({ ...mythic, key: crypto.randomUUID() });
      }
      await refresh();
    } catch (err) {
      if (err.status >= 400 && err.status < 500) { setPending(null); setError(err.message); }
      else setError(`${err.message} Retry to recover the same pull request.`);
    } finally { setBusy(false); }
  }
  return <section className={styles.page}>
    {showShop&&<ExclusiveShop onClose={()=>setShowShop(false)}/>}
    {single && <CrateOpenOverlay result={single} crateName={banner?.title} onReveal={(item, options) => { if (!options?.skipCutscene) setScene({ ...item, key: crypto.randomUUID() }); }} onClose={() => { setSingle(null); setScene(null); }}/>}
    {results && <OpeningResults items={results} onClose={() => { setResults(null); setScene(null); }}/>}
    {scene && <RarityBurst key={scene.key} itemName={scene.itemName} rarity={scene.rarity}/>}
    {showPool && <ScreenDialog title="Standard reward pool" onClose={() => setShowPool(false)}><p>Standard reward odds below reflect your active potion. Each roll is independent.</p><ul className={styles.pool}>{banner.rewards.filter(item => !item.limited).map(item => <li key={item.name}><ItemIcon name={item.name} size={40}/><div><strong>{item.name}</strong><small>{RARITY_LABEL[item.rarity]}</small></div><b>{item.chance.toFixed(3)}%</b></li>)}</ul></ScreenDialog>}
    <header className={styles.heading} data-page-header="true"><div><small>LIMITED BANNER</small><h1>{banner?.title || "Limited banners"}</h1></div><div className={styles.headerActions}><button onClick={()=>setShowShop(true)}><GemIcon size={22}/> Luck potions</button><button disabled={!banner} onClick={() => setShowPool(true)}>View standard pool ↗</button></div></header>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {!banners ? <p role="status">Loading the gallery…</p> : !banner ? <div className={styles.empty}><p>{error ? "The gallery couldn’t be loaded." : "No banners are currently scheduled."}</p>{error && <button onClick={() => { setBanners(null); setError(""); setLoadAttempt(value => value + 1); }}>Try again</button>}</div> : <>
      <div className={`${styles.bannerStage} ${!secret ? styles.noSecret : ""}`}>
        {secret && <article className={styles.secret} aria-label="Featured secret relic">
          <div className={styles.secretInner}>
            <div className={styles.secretTop}><span>SECRET</span><small>THE UNKNOWN AWAITS</small></div>
            <div className={styles.secretArt} aria-hidden="true"><div className={styles.orbit}/><ItemIcon name="Eclipse of Tomorrow" size={260}/><span>?</span></div>
            <div className={styles.secretCaption}><h2>Secret relic</h2><p>Identity sealed. Odds unknown.</p>{wallet?.unlimited && <button onClick={() => preview("Eclipse of Tomorrow")}>DEV · Unveil animation</button>}</div>
          </div>
        </article>}
        <section className={styles.featured} aria-label="Featured banner rewards">
          <header className={styles.featuredHeading}><h2>Featured rewards</h2><span>LIMITED + STANDARD</span></header>
          <div className={styles.rewardBoxes}>{showcase.map(item => <article key={item.name} className={styles.rewardBox} style={{ "--relic": resolveItemDesign(item.name).color }}>
            <div className={styles.itemArt}><ItemIcon name={item.name} size={90}/><span className={styles.tileRarity}>{item.limited ? "LIMITED" : RARITY_LABEL[item.rarity]}</span></div>
            <div className={styles.itemDetails}><h3>{item.name}</h3><strong>{item.chance.toFixed(3)}% <span>per pull</span></strong>{wallet?.unlimited && item.limited && <button aria-label={`Preview ${item.name} animation`} onClick={() => preview(item.name)}>Preview reveal</button>}</div>
          </article>)}</div>
          <p className={styles.poolNote}>Standard rewards are part of every summon’s pool.{gems?.rollsRemaining>0&&gems.rollsRemaining<10?` A 10× summon boosts the first ${gems.rollsRemaining} rolls, then returns to standard odds.`:""}</p>
        </section>
      </div>
      <footer className={styles.pullBar}><div><small>{active ? "AVAILABLE UNTIL" : "UNAVAILABLE"}</small><span>{new Date(banner.endsAt).toLocaleString()}</span><p>Featured odds: {gems?.rollsRemaining>0?gems.multiplier:1}×{gems?.rollsRemaining>0?` · ${gems.rollsRemaining} boosted rolls left`:""}. Secret unchanged. No pity guarantee.</p></div><div className={styles.pullButtons}>{[1, 10].map(count => <button key={count} disabled={busy || (pending ? pending.count !== count : !active || !wallet || (!wallet.unlimited && wallet.softBalance < banner.price * count))} onClick={() => pull(count)}>{busy && pending?.count === count ? "Opening…" : pending?.count === count ? "Retry opening" : `${count}× Summon`}<span>{(banner.price * count).toLocaleString()} coins</span></button>)}</div></footer>
    </>}
  </section>;
}
