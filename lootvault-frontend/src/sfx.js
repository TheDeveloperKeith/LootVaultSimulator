import notificationAudio from "./assets/audio/kenney-notification.wav";
import { effectVolume } from "./audio/volume";
import clickAudio from "./assets/audio/kenney-click_003.ogg";
import winAudio from "./assets/audio/kenney-win.ogg";
import lossAudio from "./assets/audio/kenney-loss.ogg";
import confirmAudio from "./assets/audio/kenney-confirmation_002.ogg";
import backAudio from "./assets/audio/kenney-back_002.ogg";
import tickAudio from "./assets/audio/kenney-drop_003.ogg";
import rewardAudio from "./assets/audio/kenney-maximize_001.ogg";
import glassShatterAudio from "./assets/audio/glass-shatter-c-rogers.mp3";
import applauseAudio from "./assets/audio/audience-applause.ogg";
import rainAudio from "./assets/audio/exotic-rain.wav";
import mysteryAudio from "./assets/audio/monarch-dutonic.mp3";
import boosAudio from "./assets/audio/crowd-boos-neospica.mp3";
import { createMysteryRevealEffects } from "./audio/mysteryRevealEffects";
// UI tones and locally bundled reveal audio.
const activeEffects = new Set();
let muted = false;

let stopRevealAudio;

try {
  muted = localStorage.getItem("lv-muted") === "1";
} catch {
  /* storage unavailable: keep default */
}

export const isMuted = () => muted;

export function setMuted(value) {
  muted = value;
  if (value) { stopRevealAudio?.(); activeEffects.forEach(stop => stop()); }
  window.dispatchEvent(new Event("lootvault:sound-changed"));
  try {
    localStorage.setItem("lv-muted", value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function playGameEffect(kind = "click", volume = .5, pitch = 1) {
  if (muted) return;
  const clips = { win:winAudio, loss:lossAudio, click:clickAudio, confirm:confirmAudio, back:backAudio, tick:tickAudio, reward:rewardAudio, notification:notificationAudio };
  const audio = new Audio(clips[kind] || clickAudio);
  const release = effectVolume(audio, Math.max(0, Math.min(1, volume)));
  audio.preservesPitch = false;
  audio.playbackRate = Math.max(.65, Math.min(1.5, pitch));
  if (activeEffects.size >= 6) activeEffects.values().next().value?.();
  const stop = () => { audio.pause(); release(); clearTimeout(timer); audio.onended = null; activeEffects.delete(stop); };
  const timer = setTimeout(stop, 8000);
  activeEffects.add(stop); audio.onended = stop;
  void audio.play().catch(stop);
  return stop;
}

export function playRoundResult(outcome) {
  if (outcome === "WIN") return playGameEffect("win", .65);
  if (outcome === "LOSS") return playGameEffect("loss", .55);
  return playGameEffect("reward", .4);
}

// Preserve existing reveal cues while replacing square-wave bleeps with game assets.
export function blip(freq = 660, dur = .05, gain = .05) {
  return playGameEffect(freq >= 750 ? "reward" : dur >= .15 ? "confirm" : freq < 300 ? "tick" : "click", Math.min(.8, gain * 8));
}
export function playRarityFanfare(rarity) {
  stopRevealAudio?.();
  const clips = { EXTRAORDINARY: [applauseAudio, 4, .9], EXOTIC: [rainAudio, 0, .45], EXTRA_EXTRAORDINARY: [mysteryAudio, 30, .5] };
  if (muted || !clips[rarity]) return;
  const [src, offset, volume] = clips[rarity];
  const audio = new Audio(src);
  audio.currentTime = offset;
  const release = effectVolume(audio, volume);
  const stopEffects = rarity === "EXTRA_EXTRAORDINARY" ? createMysteryRevealEffects() : undefined;
  const started = Date.now();
  const fade = setInterval(() => { effectVolume(audio, volume * Math.max(0, Math.min(1, (4800 - (Date.now() - started)) / 900))); }, 50);
  const stop = () => { clearInterval(fade); clearTimeout(end); audio.pause(); release(); stopEffects?.(); if (stopRevealAudio === stop) stopRevealAudio = undefined; };
  const end = setTimeout(stop, 4800);
  stopRevealAudio = stop;
  audio.onended = stop;
  void audio.play().catch(stop);
  return stop;
}

export function playAudienceReaction(win) {
  stopRevealAudio?.();
  if (muted) return;
  const audio = new Audio(win ? applauseAudio : boosAudio);
  audio.currentTime = win ? 4 : 0;
  const release = effectVolume(audio, win ? .9 : .7);
  const stop = () => { clearTimeout(end); audio.pause(); release(); if (stopRevealAudio === stop) stopRevealAudio = undefined; };
  const end = setTimeout(stop, 4800);
  stopRevealAudio = stop;
  audio.onended = stop;
  void audio.play().catch(stop);
  return stop;
}

// Recorded CC0 glass shatter by C_Rogers. One loud accent per strong hand.
export function playGlassShatter() {
  if (muted) return;
  const audio = new Audio(glassShatterAudio);
  const release = effectVolume(audio, 1);
  const stop = () => { audio.pause(); release(); clearTimeout(end); window.removeEventListener('lootvault:sound-changed', sync); audio.onended = null; };
  const sync = () => { if (muted) stop(); };
  const end = setTimeout(stop, 2000);
  audio.onended = stop;
  window.addEventListener('lootvault:sound-changed', sync);
  void audio.play().catch(stop);
  return stop;
}

export const playCrateNotification = () => playGameEffect("notification", .55);
