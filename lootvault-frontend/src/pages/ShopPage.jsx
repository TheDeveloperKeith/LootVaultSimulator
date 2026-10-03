import { useEffect, useState } from "react";
import Button from "../components/Button";
import { ApiError } from "../api/client";
import { getShopOffers, buyShopOffer } from "../api/shop";
import { useWallet } from "../wallet/WalletContext";
import styles from "./ShopPage.module.css";
import ItemIcon from "../components/ItemIcon";

const RARITY_LABEL = { COMMON: "Common", BASIC: "Basic", EXCELLENT: "Excellent", EXOTIC: "Exotic", EXTRAORDINARY: "Extraordinary" };
const RARITY_CLASS = { COMMON: "common", BASIC: "basic", EXCELLENT: "excellent", EXOTIC: "exotic", EXTRAORDINARY: "extraordinary" };

export default function ShopPage() {
  const { wallet, refresh } = useWallet();
  const [offers, setOffers] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [justBoughtId, setJustBoughtId] = useState(null);

  useEffect(() => {
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

  if (offers === null && !error) return <p>Loading this week's shop...</p>;

  const weekKey = offers?.[0]?.weekKey;

  return (
      <div className={styles.page}>
        <div className={styles.head}>
          <h1 className={styles.title}>Weekly Shop</h1>
          {weekKey && <p className={styles.sub}>Rotation {weekKey} — new items every week</p>}
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <ul className={styles.grid}>
          {(offers ?? []).map((offer) => {
            const rarityClass = styles[RARITY_CLASS[offer.rarity]] ?? "";
            const affordable = (wallet?.softBalance ?? 0) >= offer.priceAmount;
            const bought = offer.id === justBoughtId;

            return (
                <li key={offer.id} className={`${styles.card} ${rarityClass}`}>
                  <span className={styles.rarityTag}>{RARITY_LABEL[offer.rarity] ?? offer.rarity}</span>
                  <span className={styles.art}><ItemIcon name={offer.itemName} size={48} /></span>
                  <h2 className={styles.itemName}>{offer.itemName}</h2>
                  <p className={styles.price}>
                    <span className={styles.coin} aria-hidden="true" />
                    {offer.priceAmount}
                  </p>
                  <Button
                      size="sm"
                      variant="secondary"
                      disabled={!affordable || buyingId === offer.id}
                      onClick={() => handleBuy(offer)}
                  >
                    {buyingId === offer.id ? "Buying..." : bought ? "Bought!" : affordable ? "Buy" : "Not enough coins"}
                  </Button>
                </li>
            );
          })}
        </ul>
      </div>
  );
}
