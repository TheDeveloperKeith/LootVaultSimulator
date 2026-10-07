import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { readLoadout,saveLoadout,eligibleRelic } from "../items/loadout";
import { resolveItemDesign } from "../items/designs";
import ScreenDialog from "../components/ScreenDialog";
import Button from "../components/Button";
import { ApiError } from "../api/client";
import { getInventory, sellItem } from "../api/game";
import { RARITY_LABEL, RARITY_CLASS, RARITY_ORDER } from "../rarities";
import { useWallet } from "../wallet/WalletContext";
import styles from "./InventoryPage.module.css";
import ItemIcon from "../components/ItemIcon";

const SOURCE_LABEL = {
  GACHA_PULL: "Daily crate",
  GACHA_PULL_PAID: "Unlimited box",
  SHOP_PURCHASE: "Shop",
  CRATE_OPEN: "Crate",
  BANNER_PULL: "Limited banner",
  ADMIN_GRANT: "Granted",
  CRAFT: "Crafted",
  CRAFTING: "Crafted",
};

export default function InventoryPage() {
  const {player}=useAuth();
  const [loadout,setLoadout]=useState(()=>readLoadout(player?.username));
  const [selected,setSelected]=useState(null);
  const [search,setSearch]=useState("");
  function updateLoadout(next){setLoadout(next);saveLoadout(player?.username,next);}
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
    return items.filter(i => (rarityFilter === "ALL" || i.rarity === rarityFilter) && i.itemName.toLowerCase().includes(search.toLowerCase()));
  }, [items, rarityFilter, search]);

  async function handleSell(itemId) {
    setSellingId(itemId);
    setError(null);
    try {
      await sellItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      if(loadout.sword===itemId || loadout.shield===itemId) updateLoadout({...loadout,sword:loadout.sword===itemId?null:loadout.sword,shield:loadout.shield===itemId?null:loadout.shield});
      setSelected(null);
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
        <div className={styles.head} data-page-header="true">
          <div>
            <h1 className={styles.title}>Inventory</h1>
            <p className={styles.sub}>Your collection. Your next great discovery.</p>
          </div>
          <p className={styles.count}>{items.length} item{items.length === 1 ? "" : "s"}</p>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.workbench}><label>Filter name<input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Find an item…"/></label><label><input type="checkbox" checked={loadout.enabled} onChange={event=>updateLoadout({...loadout,enabled:event.target.checked})}/> Mythic action effects</label><small>???? only · cosmetic slash and guard effects · reduced motion respected</small></div>
        {selected && <ScreenDialog title={selected.itemName} onClose={()=>setSelected(null)}><ItemIcon name={selected.itemName} size={120}/><p>{RARITY_LABEL[selected.rarity]} · {SOURCE_LABEL[selected.acquiredVia] || selected.acquiredVia}</p>{eligibleRelic(selected) && ["sword","shield"].includes(resolveItemDesign(selected.itemName).type) && <Button onClick={()=>{const type=resolveItemDesign(selected.itemName).type;updateLoadout({...loadout,[type]:loadout[type]===selected.id?null:selected.id});}}>{loadout[resolveItemDesign(selected.itemName).type]===selected.id ? "Unequip effect" : "Equip action effect"}</Button>}<p>Effects change basic actions at both card tables. They do not change results or payouts.</p><Button variant="danger" disabled={sellingId!==null} onClick={()=>handleSell(selected.id)}>Sell item</Button></ScreenDialog>}
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
                    <button className={styles.inspect} onClick={()=>setSelected(item)} aria-label={`Inspect ${item.itemName}`}><span className={styles.art}><ItemIcon name={item.itemName} size={90}/></span><span className={styles.nameplate}><strong>{item.itemName}</strong><small>{RARITY_LABEL[item.rarity]}{loadout.sword===item.id || loadout.shield===item.id ? " · EQUIPPED" : ""}</small></span></button>
                  </li>
              ))}
            </ul>
        )}
      </div>
  );
}
