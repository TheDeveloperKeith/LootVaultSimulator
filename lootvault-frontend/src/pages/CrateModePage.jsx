import {exchangeCrateForGems} from "../api/gems";
import GemIcon from "../components/GemIcon";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import OpeningResults from "../components/OpeningResults";
import Button from "../components/Button";
import CrateOpenOverlay from "../components/CrateOpenOverlay";
import RarityBurst from "../components/RarityBurst";
import { ApiError } from "../api/client";
import { getCrateTypes, getMyCrates, buyCrate, openCrate, openCrates, sellCrate } from "../api/crates";
import { fireConfetti } from "../sandbox/effects";
import { RARITY_LABEL, RARITY_ORDER, BURST_RARITIES } from "../rarities";
import { useWallet } from "../wallet/WalletContext";
import styles from "./CrateModePage.module.css";
import PagedGrid from "../components/PagedGrid";
import ScreenDialog from "../components/ScreenDialog";
import CrateIcon from "../components/CrateIcon";

import { WEAPON_DESIGNS } from "../items/designs";

function toDisplayPercents(odds) {
  const total = Object.values(odds).reduce((sum, w) => sum + w, 0);
  return Object.fromEntries(
      Object.entries(odds).map(([rarity, w]) => [rarity, (w / total) * 100])
  );
}

function formatPct(pct) {
  if (pct < 0.01) return pct.toFixed(5) + "%";
  if (pct < 1) return pct.toFixed(2) + "%";
  return pct.toFixed(1) + "%";
}


export default function CrateModePage() {
  const { wallet, refresh: refreshWallet } = useWallet();

  const [gemExchange,setGemExchange]=useState(null);
  const [exchangeBusy,setExchangeBusy]=useState(false);
  const [exchangeNotice,setExchangeNotice]=useState("");
  const [bulkCount,setBulkCount]=useState(1);
  const [bulkResults,setBulkResults]=useState(null);
  const [bulkBusy,setBulkBusy]=useState(false);
  const [pendingBulk,setPendingBulk]=useState(null);
  async function handleBulk(crate){
    if(bulkBusy)return;
    const ids=myCrates.filter(item=>item.crateCode===crate.crateCode).slice(0,bulkCount).map(item=>item.id);
    const request=pendingBulk || {requestId:crypto.randomUUID(),ids,code:crate.crateCode};
    setPendingBulk(request);
    setBulkBusy(true);setError(null);
    try{const items=await openCrates(request.requestId,request.ids);setPendingBulk(null);setBulkResults(items);setMyCrates(previous=>previous.filter(item=>!request.ids.includes(item.id)));getMyCrates().then(setMyCrates).catch(()=>{});window.dispatchEvent(new Event("lootvault:crate-consumed"));await refreshWallet();}
    catch(error){if(error.status>=400&&error.status<500){setPendingBulk(null);getMyCrates().then(setMyCrates).catch(()=>{});setError(error.message);}else setError(`${error.message || "Opening failed."} Retry bulk opening to recover the same request.`);}
    finally{setBulkBusy(false);}
  }
  const [crateTypes, setCrateTypes] = useState(null);
  const [myCrates, setMyCrates] = useState([]);
  const [error, setError] = useState(null);
  const [buyingCode, setBuyingCode] = useState(null);
  const [sellingId, setSellingId] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const [openingCrateCode, setOpeningCrateCode] = useState("COMMON");
  const [openingCrateName, setOpeningCrateName] = useState("Vault Crate");
  const [openResult, setOpenResult] = useState(null);
  const [lastBurst, setLastBurst] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "owned" ? "owned" : "store";
  const setView = value => setSearchParams(value === "owned" ? {view:"owned"} : {});
  const [oddsCrate, setOddsCrate] = useState(null);
  const [devOpen, setDevOpen] = useState(false);
  const [devRarity, setDevRarity] = useState("EXOTIC");
  const [devItemName, setDevItemName] = useState("");
  const devItems = WEAPON_DESIGNS.filter(item => item.rarity === devRarity);
  const devItem = devItems.find(item => item.name === devItemName) || devItems[0];
  const [devSpeed, setDevSpeed] = useState(1);
  const [devSkip, setDevSkip] = useState(false);
  const [devForceVfx, setDevForceVfx] = useState(true);
  const [overlayIsDev, setOverlayIsDev] = useState(false);

  useEffect(() => {
    Promise.all([getCrateTypes(), getMyCrates()])
        .then(([types, crates]) => {
          setCrateTypes(types);
          setMyCrates(crates);
        })
        .catch((err) =>
            setError(err instanceof ApiError ? err.message : "Couldn't load crates.")
        );
  }, []);

  async function exchange(){if(exchangeBusy)return;setExchangeBusy(true);setError(null);try{await exchangeCrateForGems(gemExchange.requestId,gemExchange.crate.id);setGemExchange(null);setExchangeNotice("Mystery Crate exchanged for 10 gems.");setMyCrates(await getMyCrates());window.dispatchEvent(new Event("lootvault:crate-consumed"));await refreshWallet();}catch(err){setError(err.message+" Retry to recover the same exchange.");}finally{setExchangeBusy(false)}}
  const stacks = Object.values(myCrates.reduce((groups, crate) => { const code=crate.crateCode; if (!groups[code]) groups[code]={...crate,count:0}; groups[code].count++; return groups; }, {}));

  async function handleBuy(crateCode) {
    setBuyingCode(crateCode);
    setError(null);
    try {
      const newCrate = await buyCrate(crateCode);
      setMyCrates((prev) => [newCrate, ...prev]);
      window.dispatchEvent(new CustomEvent("lootvault:crate-notification", {detail:{code:newCrate.crateCode || crateCode, title:"New case in your vault",message:newCrate.crateDisplayName || "Your case is ready to open.",delta:1}}));
      await refreshWallet();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Purchase failed.");
    } finally {
      setBuyingCode(null);
    }
  }

  async function handleOpen(crate) {
    setError(null);
    setOpenResult(null);
    setOverlayIsDev(false);
    setOpeningCrateCode(crate.crateCode);
    setOpeningCrateName(crate.crateDisplayName ?? "Vault Crate");
    setOpeningId(crate.id);

    try {
      // The server resolves the real reward. The reel only visualizes it.
      const item = await openCrate(crate.id);
      setOpenResult(item);
      setMyCrates((prev) => prev.filter((c) => c.id !== crate.id));
      window.dispatchEvent(new Event("lootvault:crate-consumed"));
      await refreshWallet();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't open that crate.");
      setOpeningId(null);
    }
  }

  function handleReveal(item, { skipCutscene = false } = {}) {
    window.dispatchEvent(new CustomEvent("lootvault:crate-notification", {detail:{title:overlayIsDev ? "Preview reveal" : "Loot secured",message:item.itemName,code:openingCrateCode,target:"/inventory"}}));
    const shouldBurst = !skipCutscene && (overlayIsDev ? devForceVfx : BURST_RARITIES.has(item.rarity));

    if (shouldBurst) {
      setLastBurst({ rarity: item.rarity, itemName: item.itemName, itemType: item.type, key: Date.now() });
      fireConfetti(item.rarity);
    }
  }

  function runDevRoll(event) {
    setDevOpen(false);
    const fakeResult = {
      id: `dev-${event.timeStamp}`,
      itemName: devItem.name,
      type: devItem.type,
      rarity: devRarity,
      acquiredVia: "DEV_TEST",
    };

    setError(null);
    setOverlayIsDev(true);
    setOpeningCrateCode("EXCELLENT");
    setOpeningCrateName("DEV TEST CRATE");
    setOpeningId(fakeResult.id);
    setOpenResult(fakeResult);
  }

  function closeOverlay() {
    setOpeningId(null);
    setLastBurst(null);
    setOpenResult(null);
    setOverlayIsDev(false);
  }

  async function handleSell(crateId) {
    setSellingId(crateId);
    setError(null);
    try {
      await sellCrate(crateId);
      setMyCrates((prev) => prev.filter((c) => c.id !== crateId));
      window.dispatchEvent(new Event("lootvault:crate-consumed"));
      await refreshWallet();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sell that crate.");
    } finally {
      setSellingId(null);
    }
  }

  if (crateTypes === null && !error) return <p>Loading crates...</p>;

  return (
      <div className={styles.page}>
        {bulkResults && <OpeningResults items={bulkResults} onClose={()=>setBulkResults(null)}/>}{lastBurst && <RarityBurst key={lastBurst.key} rarity={lastBurst.rarity} itemName={lastBurst.itemName} itemType={lastBurst.itemType} />}

        {openingId && (
            <CrateOpenOverlay
                result={openResult}
                crateName={openingCrateName}
                onClose={closeOverlay}
                onReveal={handleReveal}
                speed={overlayIsDev ? devSpeed : 1}
                skipAnimation={overlayIsDev && devSkip}
                preview={overlayIsDev}
            />
        )}

        <div className={styles.head} data-page-header="true">
          <div>
            <h1 className={styles.title}>Crate exchange</h1>
            <p className={styles.sub}>
              Inspect a case. Check the odds. Choose your next opening.
            </p>
          </div>

          <button
              type="button"
              className={`${styles.devToggle} ${devOpen ? styles.devToggleActive : ""}`}
              onClick={() => setDevOpen((value) => !value)}
          >
            <span aria-hidden="true">⚙</span>
            Preview animation
          </button>
        </div>

        {devOpen && (
            <ScreenDialog title="Animation preview" onClose={() => setDevOpen(false)}><section className={styles.devPanel}>
              <div className={styles.devPanelHead}>
                <div>
                  <span className={styles.devEyebrow}>LOCAL ANIMATION TESTING</span>
                  <h2>Crate Reel Dev Mode</h2>
                </div>
                <span className={styles.devSafe}>NO DATABASE CHANGES</span>
              </div>

              <div className={styles.devGrid}>
                <label className={styles.devField}>
                  <span>Test rarity</span>
                  <select value={devRarity} onChange={(e) => setDevRarity(e.target.value)}>
                    {RARITY_ORDER.map((rarity) => (
                        <option key={rarity} value={rarity}>
                          {RARITY_LABEL[rarity] ?? rarity}
                        </option>
                    ))}
                  </select>
                </label>

                <label className={styles.devField}><span>Preview item</span><select value={devItem.name} onChange={event => setDevItemName(event.target.value)}>{devItems.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
                <div className={styles.devField}>
                  <span>Animation speed</span>
                  <div className={styles.speedButtons}>
                    {[1, 2, 5].map((value) => (
                        <button
                            key={value}
                            type="button"
                            className={devSpeed === value ? styles.speedActive : styles.speedButton}
                            onClick={() => setDevSpeed(value)}
                        >
                          {value}×
                        </button>
                    ))}
                  </div>
                </div>

                <label className={styles.checkRow}>
                  <input
                      type="checkbox"
                      checked={devSkip}
                      onChange={(e) => setDevSkip(e.target.checked)}
                  />
                  <span>Skip reel animation</span>
                </label>

                <label className={styles.checkRow}>
                  <input
                      type="checkbox"
                      checked={devForceVfx}
                      onChange={(e) => setDevForceVfx(e.target.checked)}
                  />
                  <span>Force rarity VFX</span>
                </label>
              </div>

              <Button size="sm" onClick={runDevRoll} disabled={openingId !== null}>
                Test Roll
              </Button>

              <p className={styles.devNote}>
                Test Roll is frontend-only. It does not spend coins, consume a crate,
                create an inventory item, or call the crate-open endpoint.
              </p>
            </section></ScreenDialog>
        )}

        {gemExchange&&<ScreenDialog title="Exchange Mystery Crate" onClose={()=>{if(!exchangeBusy)setGemExchange(null)}}><p>Trade one unopened Mystery Crate for <GemIcon size={32}/> <strong>10 gems</strong>? This consumes the crate without an item roll.</p><Button disabled={exchangeBusy} onClick={exchange}>{exchangeBusy?"Exchanging…":"Exchange for 10 gems"}</Button></ScreenDialog>}
        {exchangeNotice&&<p role="status">{exchangeNotice}</p>}
        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.catalogTabs} aria-label="Crate sections"><button aria-pressed={view === "store"} onClick={() => setView("store")}>Case market</button><button aria-pressed={view === "owned"} onClick={() => setView("owned")}>Your cases ({myCrates.length})</button></div>
        {view === "owned" && <label className={styles.bulkControl}>Open quantity <select value={bulkCount} disabled={bulkBusy || Boolean(pendingBulk)} onChange={event=>setBulkCount(Number(event.target.value))}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select><small>Up to 10 of the selected crate type · all rewards saved together</small></label>}
        {view === "store" ? <PagedGrid key="store" items={crateTypes ?? []} label="Cases for sale" minHeight={270} maxColumns={4} className={styles.buyGrid} renderItem={(crate) => {
              const affordable = (wallet?.softBalance ?? 0) >= crate.priceAmount;

              return (
                  <li key={crate.code} className={styles.buyCard}>
                    <div className={styles.crateArt}><CrateIcon code={crate.code} size={100}/></div><h3 className={styles.crateName}>{crate.displayName}</h3>
                    <small className={styles.floor}>Guaranteed {crate.code === "COMMON" ? "Common" : crate.code === "BASIC" ? "Basic" : "Excellent"} or better · odds total 100%</small>

                    <p className={styles.price}>
                      <span className={styles.coin} aria-hidden="true" />
                      {crate.priceAmount}
                    </p>

                    <button className={styles.oddsLink} onClick={() => setOddsCrate(crate)}>Drop odds ↗</button><Link className={styles.oddsLink} to={`/crates/${crate.code}`}>Inspect contents ↗</Link>

                    <Button
                        size="sm"
                        variant="secondary"
                        disabled={!affordable || buyingCode === crate.code || bulkBusy}
                        onClick={() => handleBuy(crate.code)}
                    >
                      {buyingCode === crate.code
                          ? "Buying..."
                          : affordable
                              ? "Buy"
                              : "Not enough coins"}
                    </Button>
                  </li>
              );
            }} /> : <PagedGrid key="owned" items={stacks} label="Owned cases" minHeight={245} maxColumns={3} className={styles.ownedGrid} renderItem={(crate) => (

                    <li key={crate.id} className={styles.ownedCard}>
                      <button className={styles.crateOpenIcon} onClick={() => bulkCount > 1 || pendingBulk ? handleBulk(crate) : handleOpen(crate)} disabled={exchangeBusy || openingId !== null || bulkBusy || Boolean(pendingBulk && pendingBulk.code !== crate.crateCode)} aria-label={`Open ${crate.crateDisplayName || "crate"} · ${crate.count} available`}><CrateIcon code={crate.crateCode} size={128}/><b className={styles.stackCount}>{crate.count}</b><span>{bulkBusy ? "OPENING…" : `OPEN ${Math.min(bulkCount,crate.count)} ↗`}</span></button>
                      <span className={styles.ownedName}>{crate.crateDisplayName}</span><Link className={styles.oddsLink} to={`/crates/${crate.crateCode}`}>Inspect contents ↗</Link>


                      <div className={styles.ownedActions}>
                        {crate.crateCode==="EXTRA_EXTRAORDINARY"&&<Button size="sm" variant="secondary" disabled={sellingId!==null||openingId!==null||bulkBusy||Boolean(pendingBulk)||exchangeBusy} onClick={()=>setGemExchange({requestId:crypto.randomUUID(),crate})}><GemIcon size={20}/> Trade · 10 gems</Button>}


                        <Button
                            size="sm"
                            variant="danger"
                            disabled={exchangeBusy || sellingId === crate.id || openingId !== null || bulkBusy || Boolean(pendingBulk)}
                            onClick={() => handleSell(crate.id)}
                        >
                          {sellingId === crate.id ? "Selling..." : "Sell one"}
                        </Button>
                      </div>
                    </li>
                )} />}
        {oddsCrate && <ScreenDialog title={`${oddsCrate.displayName} · drop odds`} onClose={() => setOddsCrate(null)}><ul className={styles.oddsList}>{Object.entries(toDisplayPercents(oddsCrate.odds)).map(([rarity, pct]) => <li key={rarity} className={styles.oddsRow}><span>{RARITY_LABEL[rarity] ?? rarity}</span><span>{formatPct(pct)}</span></li>)}</ul><p>Each opening is independent. These probabilities total 100%.</p></ScreenDialog>}
      </div>
  );
}
