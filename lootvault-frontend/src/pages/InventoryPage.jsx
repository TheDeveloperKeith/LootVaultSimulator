import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import { ApiError } from "../api/client";
import { getInventory, sellItem } from "../api/game";
import { RARITY_LABEL, RARITY_CLASS, RARITY_ORDER } from "../rarities";
import { useWallet } from "../wallet/WalletContext";
import styles from "./InventoryPage.module.css";
import ItemIcon from "../components/ItemIcon";

const SOURCE_LABEL = {
  GACHA_PULL: "Daily box",
  GACHA_PULL_PAID: "Unlimited box",
  SHOP_PURCHASE: "Shop",
  CRATE_OPEN: "Crate",
  ADMIN_GRANT: "Granted",
  CRAFT: "Crafted",
  CRAFTING: "Crafted",
};

export default function InventoryPage() {
  const { refresh: refreshWallet } = useWallet();
  const [items, setItems] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [rarityFilter, setRarityFilter] = useState("ALL");
  const [sellingId, setSellingId] = useState(null);
  useEffect(() => {
    getInventory()
        .then(setItems)
        .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your inventory."));
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    return rarityFilter === "ALL" ? items : items.filter((i) => i.rarity === rarityFilter);
  }, [items, rarityFilter]);

  async function handleSell(itemId) {
    setSellingId(itemId);
    setError(null);
    try {
      await sellItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      await refreshWallet();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sell that item.");
    } finally {
      setSellingId(null);
    }
  }

  if (items === null && !error) return <p>Loading your inventory...</p>;
  if (error && !items) return <p className={styles.errorText}>{error}</p>;

  return (
      <div className={styles.page}>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>Inventory</h1>
            <p className={styles.sub}>Your collected items, all in one place.</p>
          </div>
          <p className={styles.count}>{items.length} item{items.length === 1 ? "" : "s"}</p>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.filters}>
          <button
              aria-pressed={rarityFilter === "ALL"}
              className={rarityFilter === "ALL" ? styles.filterActive : styles.filter}
              onClick={() => setRarityFilter("ALL")}
          >
            All
          </button>
          {RARITY_ORDER.map((r) => (
              <button
                  aria-pressed={rarityFilter === r}
                  key={r}
                  className={rarityFilter === r ? styles.filterActive : styles.filter}
                  onClick={() => setRarityFilter(r)}
              >
                {RARITY_LABEL[r]}
              </button>
          ))}
        </div>

        {filtered.length === 0 ? (
            <p className={styles.empty}>
              {items.length === 0 ? "Nothing here yet — open a box, crate, or visit the shop." : "No items match this filter."}
            </p>
        ) : (
            <ul className={styles.grid}>
              {filtered.map((item) => (
                  <li key={item.id} className={`${styles.card} ${styles[RARITY_CLASS[item.rarity]] ?? ""}`}>
                    <span className={styles.art}><ItemIcon name={item.itemName} size={48} /></span>
                    <h2 className={styles.itemName}>{item.itemName}</h2>
                    <span className={styles.rarityTag}>{RARITY_LABEL[item.rarity] ?? item.rarity}</span>
                    <span className={styles.source}>{SOURCE_LABEL[item.acquiredVia] ?? item.acquiredVia}</span>
                    <Button
                        size="sm"
                        variant="danger"
                        disabled={sellingId !== null}
                        onClick={() => handleSell(item.id)}
                    >
                      {sellingId === item.id ? "Selling..." : "Sell"}
                    </Button>
                  </li>
              ))}
            </ul>
        )}
      </div>
  );
}
