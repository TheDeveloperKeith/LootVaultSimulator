import { useEffect, useState } from "react";
import { getEarnState } from "../api/earn";
import Button from "../components/Button";
import { ApiError } from "../api/client";
import { getShopOffers, buyShopOffer } from "../api/shop";
import { useWallet } from "../wallet/WalletContext";
import styles from "./ShopPage.module.css";
import ItemIcon from "../components/ItemIcon";

const RARITY_LABEL = { COMMON: "Common", BASIC: "Basic", EXCELLENT: "Excellent", EXOTIC: "Exotic", EXTRAORDINARY: "Extraordinary", EXTRA_EXTRAORDINARY: "????" };
const RARITY_CLASS = { COMMON: "common", BASIC: "basic", EXCELLENT: "excellent", EXOTIC: "exotic", EXTRAORDINARY: "extraordinary", EXTRA_EXTRAORDINARY: "mystery" };

export default function ShopPage() {
  const { wallet, refresh } = useWallet();
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
        <div className={styles.head}>
          <h1 className={styles.title}>The collection shop</h1>
          {weekKey && <p className={styles.sub}>Rotation {weekKey} · A new chapter for your collection every week.</p>}
        </div>

        <div className={styles.shopIntro}><span>BUILD YOUR OWN LEGEND</span><p>Small discoveries. Big possibilities. Choose the pieces you love, at your own pace.</p></div>
        <p role="status" aria-live="polite">{justBoughtId ? "Item added to your collection. Your coin balance is updated." : ""}</p>
        {error && <p role="alert" className={styles.errorText}>{error}</p>}

        <ul className={styles.grid}>
          {(offers ?? []).map((offer) => {
            const rarityClass = styles[RARITY_CLASS[offer.rarity]] ?? "";
            const affordable = wallet?.unlimited || (wallet?.softBalance ?? 0) >= offer.priceAmount;
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
                  {dailyCoins && !affordable && <small className={styles.savings}>About {Math.ceil(Math.max(0, offer.priceAmount - (wallet?.softBalance || 0)) / dailyCoins)} daily claims to save the difference. Quests can help; assumes no spending.</small>}
                  <Button
                      size="sm"
                      variant="secondary"
                      disabled={!affordable || buyingId !== null}
                      onClick={() => handleBuy(offer)}
                  >
                    {buyingId === offer.id ? "Buying..." : bought ? "Bought!" : affordable ? "Add to collection" : "Save up for this item"}
                  </Button>
                </li>
            );
          })}
        </ul>
      </div>
  );
}
