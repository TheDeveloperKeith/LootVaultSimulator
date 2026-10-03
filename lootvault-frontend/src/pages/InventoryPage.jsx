import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import { ApiError } from "../api/client";
import { getInventory, sellItem } from "../api/game";
import { RARITY_LABEL, RARITY_CLASS, RARITY_ORDER } from "../rarities";
import { useWallet } from "../wallet/WalletContext";
import styles from "./InventoryPage.module.css";
import { craftItems } from "../api/progression";
import { Link } from "react-router-dom";
import progressionStyles from "./ProgressionPage.module.css";
import ItemIcon from "../components/ItemIcon";

const RECIPES = { COMMON: "BASIC", BASIC: "EXCELLENT", EXCELLENT: "EXOTIC", EXOTIC: "EXTRAORDINARY" };

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
  const [selected, setSelected] = useState([]);
  const [crafting, setCrafting] = useState(false);
  const [craftResult, setCraftResult] = useState(null);
  const selectedRarity = items?.find(item => selected.includes(item.id))?.rarity;

  function toggleSelection(item) {
    setSelected(previous => previous.includes(item.id)
      ? previous.filter(id => id !== item.id)
      : [...previous, item.id]);
  }

  async function handleCraft() {
    if (selected.length !== 5 || crafting) return;
    setCrafting(true);
    setError(null);
    setCraftResult(null);
    try {
      const result = await craftItems(selected);
      setItems(previous => previous.filter(item => !selected.includes(item.id)).concat({
        id: result.inventoryItemId, itemName: result.name, rarity: result.rarity, acquiredVia: "CRAFT",
      }));
      setSelected([]);
      setCraftResult(result);
      await refreshWallet();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? "Crafting is not available on the server yet. Your selected items have not been consumed." : err.message || "Couldn't craft this item.");
    } finally { setCrafting(false); }
  }

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
      setSelected(previous => previous.filter(id => id !== itemId));
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

        <section className={progressionStyles.panel}>
          <h2>Craft an upgrade</h2>
          <p>Select five items of the same rarity to consume them for one random item from the next tier. Your permanent collection keeps every discovery.</p>
          <p className={progressionStyles.dim}>Common → Basic → Excellent → Exotic → Extraordinary. Each upgrade costs five items.</p>
          <div className={progressionStyles.row}>
            <span>{selected.length} / 5 selected{selectedRarity ? ` · ${RARITY_LABEL[selectedRarity]} → ${RARITY_LABEL[RECIPES[selectedRarity]]}` : ""}</span>
            <div className={progressionStyles.links}>
              <Button size="sm" variant="secondary" disabled={crafting || selected.length === 0} onClick={() => setSelected([])}>Clear selection</Button>
              <Button size="sm" disabled={selected.length !== 5 || crafting || sellingId !== null} onClick={handleCraft}>{crafting ? "Crafting…" : "Consume 5 & craft"}</Button>
            </div>
          </div>
          {selected.length > 0 && <ul>{items.filter(item => selected.includes(item.id)).map(item => <li key={item.id}>{item.itemName}</li>)}</ul>}
          {craftResult && <p role="status">Crafted {craftResult.name} · {RARITY_LABEL[craftResult.rarity]}! <Link to="/progression">View collection and quests →</Link></p>}
        </section>

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
                    {RECIPES[item.rarity] && <label className={styles.craftSelection}>
                      <input type="checkbox" checked={selected.includes(item.id)}
                        disabled={crafting || sellingId !== null || (!selected.includes(item.id) && (selected.length >= 5 || (selectedRarity && selectedRarity !== item.rarity)))}
                        onChange={() => toggleSelection(item)} /> Select for crafting
                    </label>}
                    <Button
                        size="sm"
                        variant="danger"
                        disabled={sellingId !== null || crafting || selected.includes(item.id)}
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
