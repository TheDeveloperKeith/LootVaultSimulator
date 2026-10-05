import { useSyncExternalStore } from "react";
const event = "lootvault:motion-changed";
export function isReducedMotion() {
  try { if (localStorage.getItem("lv-reduced-motion") === "1") return true; } catch { /* optional storage */ }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
export function setReducedMotion(value) {
  try { localStorage.setItem("lv-reduced-motion", value ? "1" : "0"); } catch { /* optional storage */ }
  document.documentElement.dataset.reducedMotion = String(isReducedMotion());
  window.dispatchEvent(new Event(event));
}
function subscribe(callback) {
  const system = window.matchMedia("(prefers-reduced-motion: reduce)");
  window.addEventListener(event, callback); system.addEventListener("change", callback);
  return () => { window.removeEventListener(event, callback); system.removeEventListener("change", callback); };
}
export function useReducedMotion() { return useSyncExternalStore(subscribe, isReducedMotion, () => true); }
