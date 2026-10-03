// Fictional sword/shield catalog for Sandbox Mode. Nothing here touches the
// real database, wallet, or inventory — it exists only so the odds are
// visible and fun to poke at. RARITY_WEIGHT mirrors the real backend's
// tier proportions (see V3 migration), split evenly across the 6 items
// (3 swords + 3 shields) in each tier.

import { WEAPON_DESIGNS } from "../items/designs";
export const RARITY_WEIGHT = {
  COMMON: 0.45,
  BASIC: 0.28,
  EXCELLENT: 0.15,
  EXOTIC: 0.08,
  EXTRAORDINARY: 0.04,
};

export const RARITY_LABEL = {
  COMMON: "Common",
  BASIC: "Basic",
  EXCELLENT: "Excellent",
  EXOTIC: "Exotic",
  EXTRAORDINARY: "Extraordinary",
};

// Ordered rarest-first — used for the stats panel and the filter list.
export const RARITY_ORDER = ["EXTRAORDINARY", "EXOTIC", "EXCELLENT", "BASIC", "COMMON"];

const RAW_ITEMS = [
  // ---- COMMON (3 swords, 3 shields) ----
  { name: "Training Sword", rarity: "COMMON", type: "sword" },
  { name: "Rusted Blade", rarity: "COMMON", type: "sword" },
  { name: "Apprentice Saber", rarity: "COMMON", type: "sword" },
  { name: "Wooden Buckler", rarity: "COMMON", type: "shield" },
  { name: "Scuffed Shield", rarity: "COMMON", type: "shield" },
  { name: "Apprentice Guard", rarity: "COMMON", type: "shield" },

  // ---- BASIC ----
  { name: "Steel Saber", rarity: "BASIC", type: "sword" },
  { name: "Honed Longsword", rarity: "BASIC", type: "sword" },
  { name: "Ranger's Blade", rarity: "BASIC", type: "sword" },
  { name: "Iron Bulwark", rarity: "BASIC", type: "shield" },
  { name: "Reinforced Shield", rarity: "BASIC", type: "shield" },
  { name: "Ranger's Guard", rarity: "BASIC", type: "shield" },

  // ---- EXCELLENT ----
  { name: "Frostbite Edge", rarity: "EXCELLENT", type: "sword" },
  { name: "Stormcaller Blade", rarity: "EXCELLENT", type: "sword" },
  { name: "Phoenix Fang", rarity: "EXCELLENT", type: "sword" },
  { name: "Frostguard Aegis", rarity: "EXCELLENT", type: "shield" },
  { name: "Stormwall Shield", rarity: "EXCELLENT", type: "shield" },
  { name: "Phoenix Bulwark", rarity: "EXCELLENT", type: "shield" },

  // ---- EXOTIC ----
  { name: "Verdant Fang", rarity: "EXOTIC", type: "sword" },
  { name: "Emerald Reaver", rarity: "EXOTIC", type: "sword" },
  { name: "Wyrmscale Blade", rarity: "EXOTIC", type: "sword" },
  { name: "Verdant Aegis", rarity: "EXOTIC", type: "shield" },
  { name: "Emerald Bulwark", rarity: "EXOTIC", type: "shield" },
  { name: "Wyrmscale Guard", rarity: "EXOTIC", type: "shield" },

  // ---- EXTRAORDINARY ----
  { name: "Dawnbringer", rarity: "EXTRAORDINARY", type: "sword" },
  { name: "Voidreaper", rarity: "EXTRAORDINARY", type: "sword" },
  { name: "Sunforged Blade", rarity: "EXTRAORDINARY", type: "sword" },
  { name: "Aegis of Dawn", rarity: "EXTRAORDINARY", type: "shield" },
  { name: "Voidwall Bulwark", rarity: "EXTRAORDINARY", type: "shield" },
  { name: "Sunforged Guard", rarity: "EXTRAORDINARY", type: "shield" },
];

// Each item's individual weight = its tier's total weight / 6 items in that tier.
const ITEMS = [...RAW_ITEMS, ...WEAPON_DESIGNS.filter(item => item.rarity !== "EXTRA_EXTRAORDINARY")];

export const SANDBOX_ITEMS = ITEMS.map((item, index) => ({
  id: `${item.rarity}-${index}`,
  ...item,
  weight: RARITY_WEIGHT[item.rarity] / ITEMS.filter(candidate => candidate.rarity === item.rarity).length,
}));
