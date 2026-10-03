import { SANDBOX_ITEMS } from "./items";

// Precompute cumulative weights once so each roll is a single pass, not a
// full re-sum every time — matters once you're rolling hundreds of times
// with auto-open.
const TOTAL_WEIGHT = SANDBOX_ITEMS.reduce((sum, item) => sum + item.weight, 0);

export function rollSandboxItem() {
  let target = Math.random() * TOTAL_WEIGHT;
  for (const item of SANDBOX_ITEMS) {
    target -= item.weight;
    if (target <= 0) return item;
  }
  return SANDBOX_ITEMS[SANDBOX_ITEMS.length - 1]; // floating-point fallback
}
