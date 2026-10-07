const levels = { master: .65, music: .7, effects: .8 };
try { const saved = JSON.parse(localStorage.getItem("lv-volume") || "{}"); for (const key of Object.keys(levels)) if (Number.isFinite(saved[key])) levels[key] = Math.max(0, Math.min(1, saved[key])); } catch { /* Keep comfortable defaults. */ }
const playing = new Map();
export const getVolumeSettings = () => ({...levels});
export const soundLevel = (channel = "effects") => levels.master * levels[channel];
export function setVolumeSetting(channel, value) {
    if (!(channel in levels) || !Number.isFinite(value)) return;
    levels[channel] = Math.max(0, Math.min(1, value));
    try { localStorage.setItem("lv-volume", JSON.stringify(levels)); } catch { /* Storage is optional. */ }
    playing.forEach((base, audio) => { audio.volume = base * soundLevel(); });
    window.dispatchEvent(new Event("lootvault:sound-changed"));
}
export function effectVolume(audio, base) { playing.set(audio, base); audio.volume = base * soundLevel(); return () => playing.delete(audio); }
