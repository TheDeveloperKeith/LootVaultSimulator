import { useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { useReducedMotion } from "../preferences/motion";

import { playAudienceReaction, playRoundResult } from "../sfx";

import styles from "./ShowdownCutscene.module.css";



export default function ShowdownCutscene({ round, onDone, audioAllowed = true, practice = false, motionAllowed = true }) {

    const preference = useReducedMotion();

    const reduced = preference || !motionAllowed;

    const scene = useRef(null);

    const button = useRef(null);

    const blackjack = round.game === "BLACKJACK";

    const extreme = !blackjack && round.showdown.extreme;

    const collision = !blackjack && ["Four of a kind", "Straight flush"].includes(round.showdown.playerHand || round.hand);

    const [revealed, setRevealed] = useState(false);

    const winners = round.showdown.winners;

    const win = round.outcome === "WIN";

    useEffect(() => { if (revealed) button.current?.focus({preventScroll:true}); }, [revealed]);

    useEffect(() => {

        const previous = document.activeElement;

        const overflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        scene.current?.focus({preventScroll:true});

        let stopAudio;

        let stopResult;



        const revealTimer = setTimeout(() => {

            setRevealed(true);

            if (audioAllowed) stopResult = playRoundResult(round.outcome);

            if (audioAllowed && blackjack && round.outcome !== "PUSH") stopAudio = playAudienceReaction(win);

            button.current?.focus({preventScroll:true});

        }, reduced ? 1000 : blackjack ? 3000 : extreme ? 10000 : 4900);

        const timer = setTimeout(onDone, reduced ? 5000 : blackjack ? 9000 : extreme ? 15000 : 8500);

        let shake;

        let finalShake;

        if (!reduced) {

            shake = scene.current?.animate(extreme ? [

                {transform:"scale(1.1) translate(-30px,18px) rotate(-.5deg)"},

                {transform:"scale(1.1) translate(34px,-22px) rotate(.5deg)"},

                {transform:"scale(1.1) translate(-24px,-18px) rotate(-.4deg)"},

                {transform:"scale(1.1) translate(28px,16px) rotate(.4deg)"}

            ] : [

                {transform:"scale(1.04) translate(0,0)"},{transform:"scale(1.04) translate(-14px,7px)"},

                {transform:"scale(1.04) translate(16px,-9px)"},{transform:"scale(1.04) translate(-10px,-5px)"},

                {transform:"scale(1.04) translate(8px,4px)"},{transform:"scale(1.04) translate(0,0)"}

            ],{delay:extreme?0:blackjack?3000:4300,duration:extreme?120:180,iterations:extreme?84:7});

            if (extreme) finalShake = scene.current?.animate([

                {transform:"scale(1.12) translate(-35px,20px) rotate(-1deg)"},

                {transform:"scale(1.12) translate(40px,-28px) rotate(1deg)"},

                {transform:"scale(1.12) translate(-28px,-20px) rotate(-.7deg)"},

                {transform:"scale(1.12) translate(30px,22px) rotate(.8deg)"}

            ],{delay:8000,duration:90,iterations:30});

        }

        return () => { clearTimeout(timer); clearTimeout(revealTimer); stopAudio?.(); stopResult?.(); shake?.cancel(); finalShake?.cancel(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus({preventScroll:true}); };

    }, [onDone, blackjack, extreme, win, round.outcome, reduced, audioAllowed]);

    return createPortal(<div className={styles.sceneShell} role="dialog" aria-modal="true" aria-label={blackjack ? "Close blackjack winner reveal" : "Showdown winner reveal"} onKeyDown={event => {

        if (event.key === "Escape") onDone();

        if (event.key === "Tab") { event.preventDefault(); (button.current || scene.current)?.focus(); }

    }}>
        <div ref={scene} tabIndex={-1} data-reduced-motion={reduced} className={`${styles.scene} ${extreme ? styles.extreme : ""} ${win ? styles.youWin : ""} ${blackjack ? styles.blackjack : ""} ${blackjack && !revealed ? styles.blackout : ""}`}>
        {!blackjack && <>

            {extreme && <><div className={styles.sky} aria-hidden="true" /><svg className={styles.cracks} viewBox="0 0 1000 800" preserveAspectRatio="none" aria-hidden="true"><path d="M500 400 420 310 450 220 350 120 390 0 M500 400 650 340 690 210 820 160 900 0 M500 400 570 510 540 610 670 720 650 800 M500 400 370 470 270 430 180 570 0 620 M500 400 670 440 750 390 890 480 1000 460 M450 220 540 170 580 60 M270 430 230 300 100 240 M570 510 710 590 830 740" /></svg><div className={styles.shatter} aria-hidden="true" /></>}

            {collision && !reduced && <div className={styles.collisionField} aria-hidden="true">
                {Array.from({length:6},(_,index)=><div key={index} className={styles.collisionStar} style={{"--angle":`${index*60}deg`,"--star-color":index%2 ? "#ffb7ed" : "#b8e6ff"}}><span/><svg viewBox="0 0 100 100"><path d="M50 0 61 36 100 50 61 64 50 100 39 64 0 50 39 36Z" fill="currentColor"/></svg></div>)}
                <div className={styles.collisionRing}/><div className={styles.collisionBloom}/>
            </div>}
            <div className={styles.stars} aria-hidden="true">{Array.from({length:180},(_,i)=><i key={i} style={{left:`${(i*37.37)%100}%`,top:`${(i*19.73)%100}%`,animationDelay:`${i%7/4}s`}} />)}</div>

            <div className={styles.rings} aria-hidden="true" />

            <div className={styles.comet} aria-hidden="true"><span /><svg viewBox="0 0 100 100"><path d="M50 0 59 41 100 50 59 59 50 100 41 59 0 50 41 41Z" fill="currentColor" /></svg></div>

            <div className={styles.impact} aria-hidden="true" />

        </>}

        {revealed && <>

            <div className={`${styles.winner} ${blackjack ? styles.blackjackWinner : ""}`} role="status">

                {blackjack && win && <svg className={styles.crown} viewBox="0 0 120 90" aria-label="Victory crown" role="img"><path d="M12 18 35 40 60 8 85 40 108 18 96 72H24Z" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round"/><path d="M25 82H95" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/><circle cx="60" cy="56" r="6" fill="currentColor"/></svg>}

                <span>{winners.length > 1 ? "HONORS SHARED" : "THE WINNER"}</span><h3>{winners.join(" & ")}</h3>

                <p>{blackjack ? `You ${round.showdown.playerHand} · Dealer ${round.showdown.opponentHand}` : round.showdown.winningHand}</p>

                <small>{practice ? "Practice preview · no coins awarded" : round.outcome === "LOSS" ? "Another hand awaits." : `${Number(round.payout).toLocaleString()} ${round.currency==="HARD"?"gems":"coins"} returned`}</small>

            </div>



        </>}

        </div><button ref={button} className={styles.skip} onClick={onDone}>{revealed ? "Continue to result ↗" : "Skip animation ↗"}</button>
    </div>, document.body);

}
