import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { blip } from "../sfx";
import styles from "./MysteryChest.module.css";

export default function MysteryChest() {
    const [playing, setPlaying] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const sceneRef = useRef(null);

    const motes = useMemo(
        () =>
            Array.from({ length: 70 }, (_, i) => ({
                id: i,
                left: `${(i * 43) % 100}%`,
                size: 2 + (i % 5) * 1.2,
            })),
        []
    );

    const feathers = useMemo(
        () =>
            Array.from({ length: 18 }, (_, i) => ({
                id: i,
                left: `${4 + ((i * 29) % 92)}%`,
                size: 16 + (i % 5) * 7,
                rotate: -35 + (i % 8) * 11,
            })),
        []
    );

    useEffect(() => {
        if (!playing || !sceneRef.current) return;

        const root = sceneRef.current;
        const q = gsap.utils.selector(root);

        const ctx = gsap.context(() => {
            gsap.set(q("[data-scene]"), { autoAlpha: 0 });
            gsap.set(q(".js-star"), {
                autoAlpha: 0,
                scale: 0.03,
                filter: "blur(28px)",
            });
            gsap.set(q(".js-wing-left"), {
                autoAlpha: 0,
                x: 80,
                rotation: 16,
                scale: 0.55,
            });
            gsap.set(q(".js-wing-right"), {
                autoAlpha: 0,
                x: -80,
                rotation: -16,
                scale: 0.55,
            });
            gsap.set(q(".js-halo"), { autoAlpha: 0, scale: 0.2 });
            gsap.set(q(".js-ray"), { autoAlpha: 0, scaleY: 0.03 });
            gsap.set(q(".js-ring"), { autoAlpha: 0, scale: 0.1 });
            gsap.set(q(".js-mote"), { autoAlpha: 0, y: "105vh" });
            gsap.set(q(".js-feather"), { autoAlpha: 0, y: -100 });
            gsap.set(q(".js-title"), {
                autoAlpha: 0,
                scale: 0.45,
                filter: "blur(24px)",
            });

            const tl = gsap.timeline({
                onComplete: () => {
                    setPlaying(false);
                    setRevealed(true);
                },
            });

            // 0–1.5: absolute white silence.
            tl.to(q(".js-white"), { autoAlpha: 1, duration: 0.18 }, 0)
                .to(q(".js-prologue"), { autoAlpha: 1, duration: 0.8 }, 0.15)
                .fromTo(
                    q(".js-prologueText"),
                    { autoAlpha: 0, letterSpacing: "1.1em", y: 8 },
                    {
                        autoAlpha: 0.75,
                        letterSpacing: "0.62em",
                        y: 0,
                        duration: 1.1,
                        ease: "power2.out",
                    },
                    0.3
                )
                .call(() => blip(420, 0.28, 0.025), [], 0.4);

            // 1.3–3.4: sky opens, tiny distant star appears.
            tl.to(q(".js-prologueText"), { autoAlpha: 0, duration: 0.45 }, 1.25)
                .to(q(".js-heaven"), { autoAlpha: 1, duration: 1.2 }, 1.35)
                .to(
                    q(".js-star"),
                    {
                        autoAlpha: 1,
                        scale: 0.2,
                        filter: "blur(7px)",
                        duration: 1.6,
                        ease: "expo.out",
                    },
                    1.55
                )
                .to(
                    q(".js-camera"),
                    {
                        scale: 1.06,
                        duration: 1.8,
                        ease: "sine.inOut",
                    },
                    1.55
                )
                .to(
                    q(".js-ray"),
                    {
                        autoAlpha: 0.3,
                        scaleY: 1,
                        duration: 1.4,
                        stagger: 0.06,
                        ease: "power3.out",
                    },
                    1.65
                );

            // 3.2–5.5: Icarus/angel silhouette forms around the star.
            tl.to(
                q(".js-star"),
                {
                    scale: 0.62,
                    filter: "blur(0px)",
                    duration: 1.65,
                    ease: "power2.inOut",
                },
                3.05
            )
                .to(
                    q(".js-wing-left"),
                    {
                        autoAlpha: 0.9,
                        x: 0,
                        rotation: -7,
                        scale: 1,
                        duration: 1.4,
                        ease: "expo.out",
                    },
                    3.3
                )
                .to(
                    q(".js-wing-right"),
                    {
                        autoAlpha: 0.9,
                        x: 0,
                        rotation: 7,
                        scale: 1,
                        duration: 1.4,
                        ease: "expo.out",
                    },
                    3.3
                )
                .to(
                    q(".js-halo"),
                    {
                        autoAlpha: 0.9,
                        scale: 1,
                        duration: 1.2,
                        ease: "back.out(1.6)",
                    },
                    3.5
                )
                .to(
                    q(".js-ring"),
                    {
                        autoAlpha: 0.6,
                        scale: 5.5,
                        duration: 1.8,
                        stagger: 0.2,
                        ease: "expo.out",
                    },
                    3.45
                )
                .call(() => blip(560, 0.55, 0.035), [], 3.65);

            // 4.6–7.0: particles rise and feathers descend.
            tl.to(
                q(".js-mote"),
                {
                    autoAlpha: 0.85,
                    y: "-15vh",
                    duration: 2.8,
                    stagger: { each: 0.018, from: "random" },
                    ease: "none",
                },
                4.35
            )
                .to(
                    q(".js-feather"),
                    {
                        autoAlpha: 0.8,
                        y: "115vh",
                        x: (i) => (i % 2 ? 90 : -90),
                        rotation: (i) => (i % 2 ? 220 : -220),
                        duration: 3.3,
                        stagger: 0.06,
                        ease: "sine.inOut",
                    },
                    4.55
                )
                .to(
                    q(".js-star"),
                    {
                        scale: 0.92,
                        duration: 1.7,
                        ease: "sine.inOut",
                    },
                    4.65
                )
                .to(
                    q(".js-camera"),
                    {
                        scale: 1.14,
                        duration: 1.8,
                        ease: "power1.in",
                    },
                    4.7
                );

            // 6.2–8.1: ascension. Wings spread, star overwhelms the frame.
            tl.to(
                q(".js-wing-left"),
                {
                    rotation: -17,
                    x: -50,
                    scale: 1.14,
                    duration: 1.15,
                    ease: "power3.inOut",
                },
                6.15
            )
                .to(
                    q(".js-wing-right"),
                    {
                        rotation: 17,
                        x: 50,
                        scale: 1.14,
                        duration: 1.15,
                        ease: "power3.inOut",
                    },
                    6.15
                )
                .to(
                    q(".js-halo"),
                    {
                        scale: 1.4,
                        boxShadow:
                            "0 0 35px #fff, 0 0 90px rgba(255,245,202,.9)",
                        duration: 1.1,
                    },
                    6.2
                )
                .to(
                    q(".js-star"),
                    {
                        scale: 1.35,
                        filter: "brightness(1.7)",
                        duration: 1.25,
                        ease: "expo.in",
                    },
                    6.45
                )
                .to(
                    q(".js-bloom"),
                    {
                        autoAlpha: 1,
                        duration: 0.55,
                        ease: "expo.in",
                    },
                    7.15
                )
                .call(() => blip(820, 0.75, 0.07), [], 7.25);

            // 7.8–10.7: rarity reveal, no chest.
            tl.to(q(".js-reveal"), { autoAlpha: 1, duration: 0.01 }, 7.75)
                .to(q(".js-heaven"), { autoAlpha: 0, duration: 0.35 }, 7.78)
                .to(q(".js-bloom"), { autoAlpha: 0.35, duration: 0.7 }, 7.85)
                .to(
                    q(".js-title"),
                    {
                        autoAlpha: 1,
                        scale: 1,
                        filter: "blur(0px)",
                        duration: 1.25,
                        ease: "expo.out",
                    },
                    7.95
                )
                .fromTo(
                    q(".js-divider"),
                    { scaleX: 0, autoAlpha: 0 },
                    {
                        scaleX: 1,
                        autoAlpha: 1,
                        duration: 0.9,
                        ease: "expo.out",
                    },
                    8.15
                )
                .to(
                    q(".js-revealHalo"),
                    {
                        autoAlpha: 0,
                        scale: 3.5,
                        duration: 2,
                        ease: "expo.out",
                    },
                    7.9
                )
                .call(() => blip(1050, 0.75, 0.08), [], 8.15)
                .to(
                    q(".js-title"),
                    {
                        scale: 1.045,
                        duration: 0.8,
                        repeat: 1,
                        yoyo: true,
                        ease: "sine.inOut",
                    },
                    9.15
                )
                .to(q(".js-reveal"), { autoAlpha: 0, duration: 0.8 }, 10.25)
                .to(q(".js-white"), { autoAlpha: 0, duration: 0.45 }, 10.35);
        }, sceneRef);

        return () => ctx.revert();
    }, [playing]);

    const start = () => {
        if (playing) return;
        setRevealed(false);
        setPlaying(true);
    };

    const cinematic =
        playing && typeof document !== "undefined"
            ? createPortal(
                <div ref={sceneRef} className={styles.cinematic}>
                    <div className={`${styles.whiteBase} js-white`} />

                    <div className={`${styles.camera} js-camera`}>
                        <div
                            data-scene
                            className={`${styles.prologue} js-prologue`}
                        >
                            <div className={`${styles.prologueText} js-prologueText`}>
                                LOOK UP.
                            </div>
                        </div>

                        <div
                            data-scene
                            className={`${styles.heaven} js-heaven`}
                        >
                            <div className={styles.skyWash} />
                            <div className={styles.clouds} />
                            <div className={styles.cloudsTwo} />

                            {[8, 18, 30, 42, 58, 70, 82, 92].map((left) => (
                                <div
                                    key={left}
                                    className={`${styles.ray} js-ray`}
                                    style={{ left: `${left}%` }}
                                />
                            ))}

                            <div className={`${styles.halo} js-halo`} />

                            <div className={`${styles.wing} ${styles.leftWing} js-wing-left`}>
                                {Array.from({ length: 9 }, (_, i) => (
                                    <i key={i} style={{ "--i": i }} />
                                ))}
                            </div>

                            <div className={`${styles.wing} ${styles.rightWing} js-wing-right`}>
                                {Array.from({ length: 9 }, (_, i) => (
                                    <i key={i} style={{ "--i": i }} />
                                ))}
                            </div>

                            <div className={`${styles.star} js-star`}>
                                <span />
                                <i />
                                <i />
                                <i />
                                <i />
                            </div>

                            <div className={`${styles.ring} js-ring`} />
                            <div className={`${styles.ring} js-ring`} />
                            <div className={`${styles.ring} js-ring`} />

                            <div className={styles.motes}>
                                {motes.map((mote) => (
                                    <span
                                        key={mote.id}
                                        className="js-mote"
                                        style={{
                                            left: mote.left,
                                            width: mote.size,
                                            height: mote.size,
                                        }}
                                    />
                                ))}
                            </div>

                            <div className={styles.feathers}>
                                {feathers.map((feather) => (
                                    <span
                                        key={feather.id}
                                        className="js-feather"
                                        style={{
                                            left: feather.left,
                                            width: feather.size,
                                            height: feather.size * 2.6,
                                            rotate: `${feather.rotate}deg`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.bloom} js-bloom`} />

                    <div
                        data-scene
                        className={`${styles.reveal} js-reveal`}
                    >
                        <div className={styles.revealClouds} />
                        <div className={`${styles.revealHalo} js-revealHalo`} />

                        <div className={`${styles.title} js-title`}>
                            <span>HEAVEN'S CHOSEN</span>
                            <div className={`${styles.divider} js-divider`} />
                            <strong>????</strong>
                            <em>ICARUS</em>
                        </div>
                    </div>

                    <div className={styles.softVignette} />
                    <div className={styles.grain} />
                </div>,
                document.body
            )
            : null;

    return (
        <div className={styles.wrap}>
            {cinematic}

            <div className={styles.preview}>
                <div className={styles.previewHalo} />
                <div className={styles.previewStar}>
                    <span />
                </div>
            </div>

            <motion.button
                className={styles.button}
                onClick={start}
                disabled={playing}
                whileHover={!playing ? { y: -2, scale: 1.035 } : undefined}
                whileTap={!playing ? { scale: 0.97 } : undefined}
            >
                {playing
                    ? "ASCENDING..."
                    : revealed
                        ? "Witness the Light Again"
                        : "Sneak Peek: ???? "}
            </motion.button>

            {revealed && (
                <motion.p
                    className={styles.caption}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Something answered.
                </motion.p>
            )}
        </div>
    );
}

