// Shared rarity metadata for the real-money-adjacent parts of the app
// (crates, inventory, selling). sandbox/items.js has its own copy scoped
// to the client-only simulator — kept separate on purpose so nothing here
// ever accidentally mixes client-side sandbox math with real gameplay data.

export const RARITY_LABEL = {
  COMMON: "Common",
  BASIC: "Basic",
  EXCELLENT: "Excellent",
  EXOTIC: "Exotic",
  EXTRAORDINARY: "Extraordinary",
  EXTRA_EXTRAORDINARY: "????",
};

export const RARITY_CLASS = {
  COMMON: "common",
  BASIC: "basic",
  EXCELLENT: "excellent",
  EXOTIC: "exotic",
  EXTRAORDINARY: "extraordinary",
  EXTRA_EXTRAORDINARY: "mystery",
};

// Rarest first.
export const RARITY_ORDER = ["EXTRA_EXTRAORDINARY", "EXTRAORDINARY", "EXOTIC", "EXCELLENT", "BASIC", "COMMON"];

// Rarities big/loud enough to earn the full-screen RarityBurst effect.
export const BURST_RARITIES = new Set(["EXOTIC", "EXTRAORDINARY", "EXTRA_EXTRAORDINARY"]);
