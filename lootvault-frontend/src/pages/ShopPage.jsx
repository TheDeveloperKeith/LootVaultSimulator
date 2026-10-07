import { useEffect, useState } from "react";
import { getEarnState } from "../api/earn";
import Button from "../components/Button";
import { ApiError } from "../api/client";
import { getShopOffers, buyShopOffer } from "../api/shop";
import { useWallet } from "../wallet/WalletContext";
import styles from "./ShopPage.module.css";
import PagedGrid from "../components/PagedGrid";
import ScreenDialog from "../components/ScreenDialog";
import ItemIcon from "../components/ItemIcon";

const RARITY_LABEL = { COMMON: "Common", BASIC: "Basic", EXCELLENT: "Excellent", EXOTIC: "Exotic", EXTRAORDINARY: "Extraordinary", EXTRA_EXTRAORDINARY: "????" };
const RARITY_CLASS = { COMMON: "common", BASIC: "basic", EXCELLENT: "excellent", EXOTIC: "exotic", EXTRAORDINARY: "extraordinary", EXTRA_EXTRAORDINARY: "mystery" };

export default function ShopPage() {
  const { wallet, refresh } = useWallet();
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [dailyCoins, setDailyCoins] = useState(null);
  const [offers, setOffers] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [justBoughtId, setJustBoughtId] = useState(null);

  useEffect(() => {
    getEarnState().then(state => setDailyCoins(state.daily.coins)).catch(() => {});
    getShopOffers()
        .then(setOffers)
        .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load the shop."));
  }, []);

  async function handleBuy(offer) {
    setBuyingId(offer.id);
    setError(null);
    try {
      await buyShopOffer(offer.id);
      await refresh(); // pull the new wallet balance so the header updates
      setJustBoughtId(offer.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Purchase failed.");
    } finally {
      setBuyingId(null);
    }
  }

  if (offers === null && !error) return <p role="status">Preparing your collection...</p>;

  const weekKey = offers?.[0]?.weekKey;

  return (
      <div className={styles.page}>
        <div className={styles.head} data-page-header="true">
          <span className={styles.eyebrow}>THE COLLECTION EXCHANGE</span><h1 className={styles.title}>The collection shop</h1>
          {weekKey && <p className={styles.sub}>Rotation {weekKey} · A new chapter for your collection every week.</p>}
        </div>

        <div className={styles.shopIntro}>Browse the display. Choose an item to inspect its price.</div>
        <p role="status" aria-live="polite">{justBoughtId ? "Item added to your collection. Your coin balance is updated." : ""}</p>
        {error && <p role="alert" className={styles.errorText}>{error}</p>}

        <PagedGrid items={offers ?? []} label="Shop offers" minHeight={245} maxColumns={3} className={styles.grid} renderItem={(offer) => {
            const rarityClass = styles[RARITY_CLASS[offer.rarity]] ?? "";
            const bought = offer.id === justBoughtId;

            return (
                <li key={offer.id} className={`${styles.card} ${rarityClass}`}>
                  <span className={styles.rarityTag}>{RARITY_LABEL[offer.rarity] ?? offer.rarity}</span>
                  <span className={styles.art}><ItemIcon name={offer.itemName} size={104} /></span>
                  <h2 className={styles.itemName}>{offer.itemName}</h2>
                  <p className={styles.price} aria-label={`${offer.priceAmount.toLocaleString()} coins`}>
                    <span className={styles.coin} aria-hidden="true" />
                    {offer.priceAmount.toLocaleString()}
                  </p>
                  <Button
                      size="sm"
                      variant="secondary"
                      disabled={buyingId !== null}
                      onClick={() => setSelectedOffer(offer)}
                  >
                    {bought ? "View purchased item" : "Inspect item"}
                  </Button>
                </li>
            );
          }} />
        {selectedOffer && <ScreenDialog title={selectedOffer.itemName} onClose={() => setSelectedOffer(null)}>
            <div className={styles.productPreview}><ItemIcon name={selectedOffer.itemName} size={140}/><div><span>{RARITY_LABEL[selectedOffer.rarity]}</span><h3>{selectedOffer.priceAmount.toLocaleString()} coins</h3><p>Purchases add this item directly to your inventory.</p></div></div>
            {dailyCoins && !wallet?.unlimited && wallet?.softBalance < selectedOffer.priceAmount && <p>About {Math.ceil((selectedOffer.priceAmount-wallet.softBalance)/dailyCoins)} daily claims to save the difference. Quests can help; assumes no spending.</p>}
            {justBoughtId === selectedOffer.id && <p role="status">Added to your vault.</p>}
            {error && <p role="alert">{error}</p>}
            <Button disabled={buyingId !== null || (!wallet?.unlimited && (wallet?.softBalance ?? 0) < selectedOffer.priceAmount)} onClick={() => handleBuy(selectedOffer)}>{buyingId ? "Buying…" : "Buy for " + selectedOffer.priceAmount.toLocaleString() + " coins"}</Button>
        </ScreenDialog>}
      </div>
  );
}
