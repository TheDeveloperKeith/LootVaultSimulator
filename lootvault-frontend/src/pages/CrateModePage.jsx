import { useEffect, useState } from "react";
import Button from "../components/Button";
import CrateOpenOverlay from "../components/CrateOpenOverlay";
import RarityBurst from "../components/RarityBurst";
import { ApiError } from "../api/client";
import { getCrateTypes, getMyCrates, buyCrate, openCrate, sellCrate } from "../api/crates";
import { fireConfetti } from "../sandbox/effects";
import { RARITY_LABEL, RARITY_ORDER, BURST_RARITIES } from "../rarities";
import { useWallet } from "../wallet/WalletContext";
import styles from "./CrateModePage.module.css";
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

  const [crateTypes, setCrateTypes] = useState(null);
  const [myCrates, setMyCrates] = useState([]);
  const [error, setError] = useState(null);
  const [buyingCode, setBuyingCode] = useState(null);
  const [sellingId, setSellingId] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const [openingCrateName, setOpeningCrateName] = useState("Vault Crate");
  const [openResult, setOpenResult] = useState(null);
  const [lastBurst, setLastBurst] = useState(null);

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

  async function handleBuy(crateCode) {
    setBuyingCode(crateCode);
    setError(null);
    try {
      const newCrate = await buyCrate(crateCode);
      setMyCrates((prev) => [newCrate, ...prev]);
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
    setOpeningCrateName(crate.crateDisplayName ?? "Vault Crate");
    setOpeningId(crate.id);

    try {
      // The server resolves the real reward. The reel only visualizes it.
      const item = await openCrate(crate.id);
      setOpenResult(item);
      setMyCrates((prev) => prev.filter((c) => c.id !== crate.id));
      await refreshWallet();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't open that crate.");
      setOpeningId(null);
    }
  }

  function handleReveal(item) {
    const shouldBurst = overlayIsDev ? devForceVfx : BURST_RARITIES.has(item.rarity);

    if (shouldBurst) {
      setLastBurst({ rarity: item.rarity, itemName: item.itemName, itemType: item.type, key: Date.now() });
      fireConfetti(item.rarity);
    }
  }

  function runDevRoll(event) {
    const fakeResult = {
      id: `dev-${event.timeStamp}`,
      itemName: devItem.name,
      type: devItem.type,
      rarity: devRarity,
      acquiredVia: "DEV_TEST",
    };

    setError(null);
    setOverlayIsDev(true);
    setOpeningCrateName("DEV TEST CRATE");
    setOpeningId(fakeResult.id);
    setOpenResult(fakeResult);
  }

  function closeOverlay() {
    setOpeningId(null);
    setOpenResult(null);
    setOverlayIsDev(false);
  }

  async function handleSell(crateId) {
    setSellingId(crateId);
    setError(null);
    try {
      await sellCrate(crateId);
      setMyCrates((prev) => prev.filter((c) => c.id !== crateId));
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
        {lastBurst && <RarityBurst key={lastBurst.key} rarity={lastBurst.rarity} itemName={lastBurst.itemName} itemType={lastBurst.itemType} />}

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

        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>Normal Crate Mode</h1>
            <p className={styles.sub}>
              Buy crates with coins. Open them through a CS-style reel and keep the item that lands.
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
            <section className={styles.devPanel}>
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
            </section>
        )}

        {error && <p className={styles.errorText}>{error}</p>}

        <section>
          <h2 className={styles.sectionTitle}>Buy a crate</h2>

          <ul className={styles.buyGrid}>
            {(crateTypes ?? []).map((crate) => {
              const percents = toDisplayPercents(crate.odds);
              const affordable = (wallet?.softBalance ?? 0) >= crate.priceAmount;

              return (
                  <li key={crate.code} className={styles.buyCard}>
                    <div className={styles.crateArt}><CrateIcon code={crate.code} size={100}/></div><h3 className={styles.crateName}>{crate.displayName}</h3>
                    <small className={styles.floor}>Guaranteed {crate.code === "COMMON" ? "Common" : crate.code === "BASIC" ? "Basic" : "Excellent"} or better · odds total 100%</small>

                    <p className={styles.price}>
                      <span className={styles.coin} aria-hidden="true" />
                      {crate.priceAmount}
                    </p>

                    <ul className={styles.oddsList}>
                      {Object.entries(percents).map(([rarity, pct]) => (
                          <li key={rarity} className={styles.oddsRow}>
                            <span>{RARITY_LABEL[rarity] ?? rarity}</span>
                            <span>{formatPct(pct)}</span>
                          </li>
                      ))}
                    </ul>

                    <Button
                        size="sm"
                        variant="secondary"
                        disabled={!affordable || buyingCode === crate.code}
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
            })}
          </ul>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Your crates ({myCrates.length})</h2>

          {myCrates.length === 0 ? (
              <p className={styles.empty}>No unopened crates yet — buy one above.</p>
          ) : (
              <ul className={styles.ownedGrid}>
                {myCrates.map((crate) => (
                    <li key={crate.id} className={styles.ownedCard}>
                      <div className={styles.ownedIdentity}><CrateIcon code={crate.crateCode} size={68}/><div><span className={styles.ownedName}>{crate.crateCode === "EXTRA_EXTRAORDINARY" ? "Mystery Crate" : crate.crateDisplayName}</span><small>{crate.crateCode === "EXTRA_EXTRAORDINARY" ? "Celestial seal" : crate.crateCode === "EXCELLENT" ? "Prism seal" : crate.crateCode === "BASIC" ? "Guardian seal" : "Vault seal"}</small></div></div>

                      <div className={styles.ownedActions}>
                        <Button
                            size="sm"
                            onClick={() => handleOpen(crate)}
                            disabled={openingId !== null}
                        >
                          Open
                        </Button>

                        <Button
                            size="sm"
                            variant="danger"
                            disabled={sellingId === crate.id || openingId !== null}
                            onClick={() => handleSell(crate.id)}
                        >
                          {sellingId === crate.id ? "Selling..." : "Sell"}
                        </Button>
                      </div>
                    </li>
                ))}
              </ul>
          )}
        </section>
      </div>
  );
}
