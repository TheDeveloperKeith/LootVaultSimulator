// Original, deterministic sound design; run with node scripts/generate-reveal-audio.mjs.
import { mkdirSync, writeFileSync } from 'node:fs';
const rate = 22050, duration = 4.8, count = Math.round(rate * duration);
let seed = 73819;
const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
const tau = Math.PI * 2;
const envelope = t => Math.min(1, t / .7) * Math.min(1, (duration - t) / 1);
const out = new URL('../src/assets/audio/', import.meta.url);
mkdirSync(out, { recursive: true });
function render(name, sample) {
  const bytes = Buffer.alloc(44 + count * 4);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(2, 22);
  bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 4, 28); bytes.writeUInt16LE(4, 32);
  bytes.writeUInt16LE(16, 34); bytes.write('data', 36); bytes.writeUInt32LE(count * 4, 40);
  let peak = 0, energy = 0;
  for (let i = 0; i < count; i++) {
    const t = i / rate, pair = sample(t, i);
    for (let ch = 0; ch < 2; ch++) {
      const value = pair[ch] * envelope(t);
      peak = Math.max(peak, Math.abs(value)); energy += value * value;
      if (Math.abs(value) >= 1) throw new Error(`${name}: clipping`);
      bytes.writeInt16LE(Math.round(value * 32767), 44 + i * 4 + ch * 2);
    }
  }
  writeFileSync(new URL(name, out), bytes);
  console.log(`${name}: ${duration}s stereo, peak=${peak.toFixed(3)}, RMS=${Math.sqrt(energy / (count * 2)).toFixed(3)}`);
}
let wind = 0, rainL = 0, rainR = 0, dropL = 0, dropR = 0;
render('exotic-rain.wav', (t) => {
  wind = wind * .997 + noise() * .003;
  rainL = rainL * .4 + noise() * .6; rainR = rainR * .4 + noise() * .6;
  dropL = dropL * .96 + (noise() > .994 ? .13 : 0);
  dropR = dropR * .96 + (noise() > .994 ? .13 : 0);
  const gust = .8 + .2 * Math.sin(t * 2.4);
  return [rainL * .24 * gust + wind * .9 + dropL * Math.sin(t * tau * 1900), rainR * .24 * gust + wind * .9 + dropR * Math.sin(t * tau * 2100)];
});
let air = 0;
render('mystery-ambience.wav', (t) => {
  air = air * .9 + noise() * .1;
  const swell = Math.sin(Math.PI * t / duration);
  const pulse = .7 + .3 * Math.sin(t * tau * 3);
  const drone = (.14 * Math.sin(t * tau * 55) + .08 * Math.sin(t * tau * 82.6) + .04 * Math.sin(t * tau * 110.3)) * swell * pulse;
  let chime = 0;
  for (const [start, hz] of [[1.8, 523.25], [2.15, 622.25], [2.5, 783.99]]) {
    const dt = t - start;
    if (dt >= 0) chime += Math.min(1, dt / .04) * Math.exp(-dt * 1.6) * (.06 * Math.sin(dt * tau * hz) + .02 * Math.sin(dt * tau * hz * 2.01));
  }
  const rise = t < 1.5 ? Math.pow(t / 1.5, 2) : 0;
  const riser = (.11 * Math.sin(tau * (90 * t + 80 * t * t)) + air * .3) * rise;
  const dt = t - 1.49;
  const impact = dt >= 0 ? .3 * Math.sin(tau * (44 * dt + 9.6 * (1 - Math.exp(-dt / .08)))) * Math.exp(-dt * 3.4) * Math.min(1, dt / .008) : 0;
  const blade = dt >= 0 ? noise() * .13 * Math.exp(-dt * 17) * Math.min(1, dt / .005) : 0;
  const whisper = air * .16 * swell;
  return [drone + chime * .85 + whisper + riser + impact + blade, drone * .95 + chime + whisper * .65 + riser * .8 + impact + blade * .8];
});
