import applauseAudio from "./assets/audio/audience-applause.ogg";
import rainAudio from "./assets/audio/exotic-rain.wav";
import mysteryAudio from "./assets/audio/monarch-dutonic.mp3";
// UI tones and locally bundled reveal audio.
let ctx;
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
  if (value) stopRevealAudio?.();
  window.dispatchEvent(new Event("lootvault:sound-changed"));
  try {
    localStorage.setItem("lv-muted", value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function blip(freq = 660, dur = 0.05, gain = 0.05) {
  if (muted) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {
    /* audio blocked: ignore */
  }
}


export function playRarityFanfare(rarity) {
  stopRevealAudio?.();
  const clips = { EXTRAORDINARY: [applauseAudio, 4, .9], EXOTIC: [rainAudio, 0, .45], EXTRA_EXTRAORDINARY: [mysteryAudio, 30, .5] };
  if (muted || !clips[rarity]) return;
  const [src, offset, volume] = clips[rarity];
  const audio = new Audio(src);
  audio.currentTime = offset;
  audio.volume = volume;
  const started = Date.now();
  const fade = setInterval(() => { audio.volume = volume * Math.max(0, Math.min(1, (4800 - (Date.now() - started)) / 900)); }, 50);
  const stop = () => { clearInterval(fade); clearTimeout(end); audio.pause(); if (stopRevealAudio === stop) stopRevealAudio = undefined; };
  const end = setTimeout(stop, 4800);
  stopRevealAudio = stop;
  audio.onended = stop;
  void audio.play().catch(stop);
  return stop;
}
