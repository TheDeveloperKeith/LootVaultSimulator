import { useEffect, useRef } from "react";
import eclipse from "../assets/banner-scenes/eclipse.webp";
import sunbreak from "../assets/banner-scenes/sunbreak.webp";
import stormheart from "../assets/banner-scenes/stormheart.webp";
import astral from "../assets/banner-scenes/astral.webp";
import styles from "./BannerBuildUp.module.css";

const ART = { eclipse, sunbreak, stormheart, astral };
const PALETTES = {
    eclipse: ["#b4ffe3", "#bb72eb"], sunbreak: ["#ffe7a0", "#ff753d"],
    stormheart: ["#c4f7ff", "#3aaee7"], astral: ["#eadcff", "#a47aff"],
};
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
const TAU = Math.PI * 2;

// All camera and VFX movement reads the same music clock as the reward cue.
// This layer survives the cue for a continuous transition into the item reveal.
export default function BannerBuildUp({ effect, timeline, revealAt, reduced }) {
    const layer = useRef(null);
    const canvas = useRef(null);
    useEffect(() => {
        if (reduced) return;
        const node = canvas.current;
        const ctx = node.getContext("2d", { alpha: true });
        if (!ctx) return;
        let width = 0, height = 0, frame;
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            width = node.clientWidth; height = node.clientHeight;
            node.width = Math.round(width * dpr); node.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        const observer = new ResizeObserver(resize); observer.observe(node); resize();
        const [light, accent] = PALETTES[effect];
        // Deterministic particle positions keep previews and live reveals identical.
        const particles = Array.from({ length: 100 }, (_, i) => ({
            angle: i * 2.399963, depth: ((i * 43) % 101) / 101,
            speed: .25 + (i % 7) * .06, size: 1 + (i % 4),
        }));
        function glow(x, y, radius, alpha, color = light) {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, color); gradient.addColorStop(1, `${color}00`);
            ctx.globalAlpha = alpha; ctx.fillStyle = gradient;
            ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
        function ring(x, y, radius, squash, angle, alpha, color = light) {
            ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
            ctx.globalAlpha = alpha; ctx.strokeStyle = color;
            ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * squash, 0, 0, TAU); ctx.stroke();
            ctx.restore();
        }
        const draw = () => {
            // React detaches refs before passive effect cleanup. A frame that
            // was already queued must stop immediately when the scene exits.
            if (!layer.current || !node.isConnected) return;
            const time = timeline.current.elapsed;
            const p = clamp(time / revealAt);
            const gather = ease((p - .22) / .6);
            const charge = ease((p - .76) / .24);
            const after = Math.max(0, time - revealAt);
            const fade = after ? 1 - ease(after / 2.5) : 1;
            layer.current.style.setProperty("--approach", ease(p / .78));
            layer.current.style.setProperty("--charge", charge);
            layer.current.style.setProperty("--after", ease(after / 1.6));
            ctx.clearRect(0, 0, width, height);
            ctx.save(); ctx.globalCompositeOperation = "lighter";
            const x = width / 2, y = height * .48, unit = Math.min(width, height);
            glow(x, y, unit * (.16 + gather * .35), (.18 + gather * .3) * fade, accent);
            // A continuous iris pulse, rather than repeated full-screen flashes.
            glow(x, y, unit * (.025 + charge * .12), (.3 + charge * .45) * fade);
            if (effect === "eclipse") {
                // Accretion ribbons spiral into a gravitational seal.
                for (let j = 0; j < 6; j++) {
                    ctx.beginPath();
                    for (let k = 0; k < 65; k++) {
                        const r = unit * (.045 + k / 65 * (.32 - charge * .13));
                        const a = j * TAU / 6 + k * .045 - time * (.25 + gather * .5);
                        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * .65;
                        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.strokeStyle = j % 2 ? accent : light; ctx.globalAlpha = (.1 + gather * .35) * fade;
                    ctx.lineWidth = 1 + j % 2; ctx.stroke();
                }
                ring(x, y, unit * (.23 - charge * .06), .73, -time * .17, .6 * gather * fade);
            } else if (effect === "sunbreak") {
                // Forge heat rises in curved columns toward the awakening sun.
                for (let j = 0; j < 12; j++) {
                    const offset = (j - 5.5) * unit * .047;
                    ctx.beginPath(); ctx.moveTo(x + offset * 1.8, height * 1.05);
                    ctx.bezierCurveTo(x + offset + Math.sin(time + j) * 45, height * .7,
                        x + offset * .5, y + unit * .12, x + offset * .08, y);
                    ctx.strokeStyle = j % 3 ? accent : light; ctx.lineWidth = 1.5 + j % 3;
                    ctx.globalAlpha = (.06 + gather * .23) * fade; ctx.stroke();
                }
                ring(x, height * .8, unit * (.26 + gather * .17), .16, 0, .4 * gather * fade, accent);
            } else if (effect === "stormheart") {
                // Two tidal ribbons rise toward a calm eye, with branching lightning.
                for (let j = 0; j < 8; j++) {
                    ctx.beginPath();
                    for (let k = 0; k <= 60; k++) {
                        const u = k / 60, px = u * width;
                        const py = height * (.71 + j * .035) + Math.sin(u * TAU + time * .5 + j * .18) * unit * (.04 + gather * .07);
                        if (!k) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.strokeStyle = j % 2 ? light : accent; ctx.globalAlpha = (.08 + gather * .18) * fade;
                    ctx.lineWidth = 1.5; ctx.stroke();
                }
                for (let j = 0; j < 3; j++) {
                    const strike = Math.pow(Math.max(0, Math.sin(time * 1.7 - j * 2.1)), 16);
                    ctx.globalAlpha = strike * gather * .45 * fade; ctx.strokeStyle = light; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(x + (j - 1) * unit * .4, 0);
                    ctx.lineTo(x + (j - 1) * unit * .2 + 20, y * .55);
                    ctx.lineTo(x + (j - 1) * unit * .24 - 25, y * .5);
                    ctx.lineTo(x, y); ctx.stroke();
                }
            } else {
                // Celestial orbits assemble a defensive constellation around the core.
                for (let j = 0; j < 4; j++) {
                    ring(x, y, unit * (.16 + j * .06) * (1 - charge * .2), .42 + j * .09,
                        time * (j % 2 ? -.12 : .16) + j * .8, (.12 + gather * .45) * fade, j % 2 ? accent : light);
                }
                for (let j = 0; j < 8; j++) {
                    const a = j * TAU / 8 + time * .07;
                    const radius = unit * (.35 - gather * .13);
                    const px = x + Math.cos(a) * radius, py = y + Math.sin(a) * radius;
                    const next = a + TAU / 8;
                    ctx.globalAlpha = gather * .3 * fade; ctx.strokeStyle = light; ctx.beginPath();
                    ctx.moveTo(px, py); ctx.lineTo(x + Math.cos(next) * radius, y + Math.sin(next) * radius); ctx.stroke();
                    glow(px, py, 8, .65 * gather * fade);
                }
            }
            for (const particle of particles) {
                const phase = (particle.depth + time * particle.speed * .11) % 1;
                const radius = unit * (.06 + (1 - phase) * .7) * (1 - charge * .6);
                const angle = particle.angle + (effect === "eclipse" ? time * .22 : effect === "astral" ? time * .07 : 0);
                let px = x + Math.cos(angle) * radius;
                let py = y + Math.sin(angle) * radius * .7;
                if (effect === "sunbreak") { px = width * particle.depth; py = height * (1 - phase); }
                if (effect === "stormheart") { px = width * particle.depth + phase * 70; py = height * phase; }
                ctx.globalAlpha = Math.sin(phase * Math.PI) * (.3 + gather * .5) * fade;
                ctx.fillStyle = particle.size > 2 ? light : accent;
                if (effect === "stormheart") ctx.fillRect(px, py, 1, 7 + gather * 12);
                else { ctx.beginPath(); ctx.arc(px, py, particle.size * (.4 + phase), 0, TAU); ctx.fill(); }
            }
            if (after < 1.5 && after > 0) {
                ring(x, y, unit * (.08 + after * .85), .8, 0, (1 - after / 1.5) * .6);
            }
            ctx.restore();
            frame = requestAnimationFrame(draw);
        };
        frame = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(frame); observer.disconnect(); };
    }, [effect, timeline, revealAt, reduced]);
    return <div ref={layer} className={`${styles.stage} ${styles[effect]} ${reduced ? styles.reduced : ""}`} aria-hidden="true">
        <img className={styles.landscape} src={ART[effect]} alt="" />
        <img className={styles.foreground} src={ART[effect]} alt="" />
        <div className={styles.veil} />
        {!reduced && <canvas ref={canvas} className={styles.effects} />}
        <div className={styles.iris} />
        <div className={styles.vignette} />
    </div>;
}
