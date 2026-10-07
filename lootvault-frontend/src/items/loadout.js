export function readLoadout(username) {
 try { return JSON.parse(localStorage.getItem(`lv-loadout:${username}`)) || {enabled:false,sword:null,shield:null}; } catch { return {enabled:false,sword:null,shield:null}; }
}
export function saveLoadout(username, loadout) { localStorage.setItem(`lv-loadout:${username}`,JSON.stringify(loadout)); }
export function eligibleRelic(item) { return item.rarity === "EXTRA_EXTRAORDINARY"; }
