import { useReducedMotion } from "../preferences/motion";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useAnimationControls } from "framer-motion";
import { blip } from "../sfx.js";
import { RARITY_LABEL, RARITY_CLASS } from "../rarities.js";
import styles from "./CrateOpenOverlay.module.css";
import ItemIcon from "./ItemIcon";
import Button from "./Button";
import { WEAPON_DESIGNS } from "../items/designs";

const CARD_WIDTH = 176;
const CARD_GAP = 14;
const STEP = CARD_WIDTH + CARD_GAP;
const WINNER_INDEX = 28;
const TOTAL_CARDS = 38;

const WEIGHTED_RARITIES = [
  "COMMON", "COMMON", "COMMON", "COMMON",
  "BASIC", "BASIC", "BASIC",
  "EXCELLENT", "EXCELLENT",
  "EXOTIC",
  "EXTRAORDINARY",
  "EXTRA_EXTRAORDINARY",
];

const PLACEHOLDER_NAMES = Object.fromEntries([...new Set(WEAPON_DESIGNS.map(item => item.rarity))].map(rarity => [rarity, WEAPON_DESIGNS.filter(item => item.rarity === rarity).map(item => item.name)]));

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function makeVisualPool(result) {
  const seedSource = `${result?.id ?? ""}${result?.itemName ?? ""}${result?.rarity ?? ""}`;
  const seed = [...seedSource].reduce((sum, char) => sum + char.charCodeAt(0), 1);
  const random = seededRandom(seed);

  const cards = Array.from({ length: TOTAL_CARDS }, (_, index) => {
    const rarity = WEIGHTED_RARITIES[Math.floor(random() * WEIGHTED_RARITIES.length)];
    const names = PLACEHOLDER_NAMES[rarity];
    return {
      visualId: `decoy-${index}-${rarity}`,
      itemName: names[Math.floor(random() * names.length)],
      rarity,
      winner: false,
    };
  });

  cards[WINNER_INDEX] = {
    ...result,
    visualId: `winner-${result?.id ?? Date.now()}`,
    winner: true,
  };

  return cards;
}

export default function CrateOpenOverlay({
                                           result,
                                           crateName = "Vault Crate",
                                           onClose,
                                           onReveal,
                                           speed = 1,
                                           skipAnimation = false,
                                           preview = false,
                                         }) {
  const [phase, setPhase] = useState(result ? "ready" : "waiting");
  const [winnerLocked, setWinnerLocked] = useState(false);
  const controls = useAnimationControls();
  const reducedMotion = useReducedMotion();
  const viewportRef = useRef(null);
  const dialogRef = useRef(null);
  const revealedRef = useRef(false);

  const cards = useMemo(() => (result ? makeVisualPool(result) : []), [result]);
  const rarityClass = result ? styles[RARITY_CLASS[result.rarity]] : "";

  const displayPhase = !result ? "waiting" : phase === "waiting" ? "ready" : phase;
  const reveal = useEffectEvent(item => onReveal?.(item));
  const close = useEffectEvent(() => {
    if (result && phase === "revealed") onClose?.();
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    function handleKey(event) {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key !== "Tab") return;
      const buttons = dialogRef.current?.querySelectorAll("button:not(:disabled)");
      if (!buttons?.length) { event.preventDefault(); return; }
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!dialogRef.current.contains(document.activeElement) || document.activeElement === dialogRef.current) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    if (!result) return;

    let cancelled = false;
    revealedRef.current = false;

    async function run() {
      if (skipAnimation || reducedMotion) {
        setWinnerLocked(true);
        setPhase("revealed");

        if (!revealedRef.current && !cancelled) {
          revealedRef.current = true;
          reveal(result);
        }
        return;
      }

      // Let the overlay paint before measuring the reel viewport.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (cancelled) return;

      const viewportWidth = viewportRef.current?.clientWidth ?? 900;
      const center = viewportWidth / 2;
      const winnerCenter = WINNER_INDEX * STEP + CARD_WIDTH / 2;

      // Small deterministic offset makes the stop feel natural while keeping
      // the selected item safely under the center line.
      const jitter = Math.max(
          -24,
          Math.min(24, ((result.itemName?.length ?? 10) - 10) * 2)
      );

      const finalX = center - winnerCenter + jitter;

      setWinnerLocked(false);
      controls.set({ x: 0 });
      setPhase("rolling");
      blip(240, 0.08, 0.04);

      const duration = Math.max(0.9, 6.4 / Math.max(speed, 0.25));

      try {
        await controls.start({
          x: finalX,
          transition: {
            duration,
            ease: [0.08, 0.72, 0.09, 1],
          },
        });
      } catch {
        return;
      }

      if (cancelled) return;

      setWinnerLocked(true);
      setPhase("settling");
      blip(520, 0.16, 0.06);

      await new Promise((resolve) =>
          setTimeout(resolve, Math.max(120, 420 / Math.max(speed, 0.25)))
      );

      if (cancelled) return;

      setPhase("revealed");

      if (!revealedRef.current) {
        revealedRef.current = true;
        reveal(result);
      }
    }

    const frame = requestAnimationFrame(() => { run(); });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      controls.stop();
    };

    // Do NOT include `phase` in this dependency list.
    // This effect changes phase itself. Depending on phase would cancel
    // the roll as soon as it changed from "ready" to "rolling".
  }, [result, controls, speed, skipAnimation, reducedMotion]);

  return createPortal(
      <div className={styles.overlay}>
        <div className={styles.backdropGlow} />

        <div ref={dialogRef} className={styles.shell} role="dialog" aria-modal="true" aria-label={`Opening ${crateName}`} tabIndex={-1}>
          <div className={styles.topline}>
            <div>
              <span className={styles.kicker}>OPENING</span>
              <h2 className={styles.crateTitle}>{crateName}</h2>
            </div>
            <div className={styles.secureTag}>Vault reveal</div>
          </div>

          {displayPhase === "waiting" ? (
              <div className={styles.loadingState}>
                <div className={styles.loader} />
                <strong>Contacting the vault...</strong>
                <span>Your item will appear in a moment.</span>
              </div>
          ) : (
              <>
                <div
                    ref={viewportRef}
                    className={`${styles.reelViewport} ${winnerLocked ? styles.locked : ""}`}
                >
                  <div className={styles.fadeLeft} />
                  <div className={styles.fadeRight} />
                  <div className={styles.centerMarker}>
                    <span />
                  </div>

                  <div className={styles.reelAnchor}>
                    <motion.div
                        className={styles.reel}
                        animate={controls}
                        initial={{ x: 0 }}
                    >
                      {cards.map((card) => {
                        const cardRarityClass = styles[RARITY_CLASS[card.rarity]] ?? "";
                        return (
                            <div
                                key={card.visualId}
                                className={`${styles.reelCard} ${cardRarityClass} ${
                                    card.winner ? styles.winnerCard : ""
                                }`}
                            >
                              <div className={styles.itemArt}><ItemIcon name={card.itemName} size={48} /></div>
                              <span className={styles.cardRarity}>
                          {RARITY_LABEL[card.rarity] ?? card.rarity}
                        </span>
                              <strong className={styles.cardName}>{card.itemName}</strong>
                            </div>
                        );
                      })}
                    </motion.div>
                  </div>
                </div>

                <div className={styles.rollStatus}>
                  {displayPhase === "ready" && "Preparing reel..."}
                  {displayPhase === "rolling" && "Rolling..."}
                  {displayPhase === "settling" && "Locking result..."}
                  {displayPhase === "revealed" && "DROP SECURED"}
                </div>

                {displayPhase === "revealed" && result && (
                    <motion.div
                        className={`${styles.revealPanel} ${rarityClass}`}
                        initial={{ opacity: 0, y: reducedMotion ? 0 : 12, scale: reducedMotion ? 1 : 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: reducedMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <span className={styles.revealEyebrow}>YOU UNBOXED</span>
                      <div className={styles.revealArt}><ItemIcon name={result.itemName} size={56} /></div>
                      <span className={`${styles.revealRarity} ${rarityClass}`}>
                  {RARITY_LABEL[result.rarity] ?? result.rarity}
                </span>
                      <h3 className={styles.revealName}>{result.itemName}</h3>
                      <p className={styles.inventoryNote}>{preview ? "Animation preview · no inventory changes" : "Added to your inventory."}</p>
                    </motion.div>
                )}
              </>
          )}

          <Button
              className={styles.closeButton}
              onClick={onClose}
              disabled={phase !== "revealed"}
          >
            {displayPhase === "revealed" ? "Continue" : "Rolling..."}
          </Button>
        </div>
      </div>,
      document.body
  );
}
