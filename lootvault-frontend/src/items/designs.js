// Original flat silhouettes: blocky starter equipment and anime-inspired relics.
export const WEAPON_DESIGNS = [
  { name: "Brickwood Sword", rarity: "COMMON", type: "sword", design: "block", color: "#c89b70" },
  { name: "Studded Saber", rarity: "COMMON", type: "sword", design: "block", color: "#aeb7c5" },
  { name: "Brickwood Shield", rarity: "COMMON", type: "shield", design: "square", color: "#c89b70" },
  { name: "Starter Plate Shield", rarity: "COMMON", type: "shield", design: "square", color: "#aeb7c5" },
  { name: "Bluebrick Blade", rarity: "BASIC", type: "sword", design: "block", color: "#8ecaff" },
  { name: "Steelstep Katana", rarity: "BASIC", type: "sword", design: "katana", color: "#a2c8f2" },
  { name: "Bluebrick Shield", rarity: "BASIC", type: "shield", design: "square", color: "#8ecaff" },
  { name: "Steelstep Guard", rarity: "BASIC", type: "shield", design: "kite", color: "#a2c8f2" },
  { name: "Wintermoon Katana", rarity: "EXCELLENT", type: "sword", design: "katana", color: "#b8e9ff" },
  { name: "Emberbreath Saber", rarity: "EXCELLENT", type: "sword", design: "flame", color: "#ffac82" },
  { name: "Wintermoon Shield", rarity: "EXCELLENT", type: "shield", design: "moon", color: "#b8e9ff" },
  { name: "Petalstorm Katana", rarity: "EXOTIC", type: "sword", design: "petal", color: "#edaacb" },
  { name: "Serpentseal Guard", rarity: "EXOTIC", type: "shield", design: "serpent", color: "#9be7c8" },
  { name: "Eclipse Cleaver", rarity: "EXTRAORDINARY", type: "sword", design: "cleaver", color: "#ddc5ef" },
  { name: "Dawncrest Saber", rarity: "EXTRAORDINARY", type: "sword", design: "flame", color: "#f0d6a2" },
  { name: "Dawncrest Aegis", rarity: "EXTRAORDINARY", type: "shield", design: "sun", color: "#f0d6a2" },
  { name: "Crimson Veil Katana", rarity: "EXTRA_EXTRAORDINARY", type: "sword", design: "katana", color: "#f16c85" },
  { name: "Voidseal Aegis", rarity: "EXTRA_EXTRAORDINARY", type: "shield", design: "moon", color: "#c4a0ef" },
];
export function resolveItemDesign(name = "", type) {
  const exact = WEAPON_DESIGNS.find(item => item.name === name);
  if (exact) return exact;
  const kind = type || (/shield|guard|aegis|buckler|bulwark/i.test(name) ? "shield" : /ring/i.test(name) ? "ring" : /cloak|armor|breastplate|robe/i.test(name) ? "armor" : "sword");
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const design = kind === "shield" ? ["square", "kite", "moon", "sun", "serpent"][hash % 5] : /training|rusted|steel|basic|common|brick/i.test(name) ? "block" : /void|reaper|eclipse/i.test(name) ? "cleaver" : /frost|katana|saber/i.test(name) ? "katana" : /phoenix|sun|dawn/i.test(name) ? "flame" : "petal";
  return { name, type: kind, design, color: "currentColor" };
}
