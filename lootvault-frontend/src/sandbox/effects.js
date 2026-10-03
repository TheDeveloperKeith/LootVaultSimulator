import confetti from "canvas-confetti";
const COLORS = { EXOTIC: ["#9ee3c6"], EXTRAORDINARY: ["#f0d6a2"], EXTRA_EXTRAORDINARY: ["#c5bcff"] };
export function fireConfetti(rarity) {
  if (!COLORS[rarity]) return;
  confetti({ particleCount: 10, spread: 70, startVelocity: 8, gravity: .3, decay: .96, ticks: 100, scalar: .55, origin: { x: .5, y: .4 }, colors: COLORS[rarity], disableForReducedMotion: true });
}
