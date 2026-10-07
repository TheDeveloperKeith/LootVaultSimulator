import { useCallback, useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import Button from "../components/Button";

import ModeIcon from "../components/ModeIcon";

import PlayingCard from "../components/PlayingCard";

import OpponentIcon from "../components/OpponentIcon";

import RiverAtmosphere from "../earn/RiverAtmosphere";

import HandFaithSequence from "../earn/HandFaithSequence";

import ShowdownCutscene from "../earn/ShowdownCutscene";

import { useReducedMotion } from "../preferences/motion";

import { DEMO_ROUNDS, DEMO_RESULT } from "./demoRounds";

import styles from "./FirstVisitTutorial.module.css";

const steps = ["Welcome", "Daily rewards", "Your modes", "Practice The River", "Your collection", "Ready to explore"];

function Cards({cards}) { return <div className={styles.cards} data-scatter-source>{cards.map((card,index)=><PlayingCard card={card} index={index} key={index}/>)}</div>; }

export default function FirstVisitTutorial({onFinish, saving, error, dailyCoins = 500}) {

 const [step,setStep]=useState(0);

 const [demo,setDemo]=useState(0);

 const [sound,setSound]=useState(false);

 const [motion,setMotion]=useState(false);

 const [reveal,setReveal]=useState(false);

 const [watched,setWatched]=useState(false);

 const reduced = useReducedMotion();

 const dialog=useRef(null); const scene=useRef(null); const heading=useRef(null);

 const endReveal=useCallback(()=>{setReveal(false);setWatched(true);},[]);

 useEffect(()=>{

   const previous=document.activeElement;const overflow=document.body.style.overflow;

   document.body.style.overflow="hidden";

   const siblings=[...document.body.children].filter(child=>child!==dialog.current);

   const inert=siblings.map(child=>[child,child.inert]);siblings.forEach(child=>{child.inert=true;});

   heading.current?.focus();

   return()=>{document.body.style.overflow=overflow;inert.forEach(([child,value])=>{child.inert=value;});if(previous?.isConnected)previous.focus();};

 },[]);

 useEffect(()=>{heading.current?.focus();},[step]);

 const round=DEMO_ROUNDS[demo];

 return createPortal(<div ref={dialog} className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="tutorial-title" data-reduced-motion={reduced || !motion} onKeyDown={event=>{

   if(reveal)return;

   if(event.key==="Escape" && !saving){event.preventDefault();onFinish();}

   if(event.key==="Tab"){

     const controls=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')];

     const first=controls[0],last=controls[controls.length-1];

     if(event.shiftKey && (document.activeElement===first || document.activeElement===heading.current)){event.preventDefault();last?.focus();}

     else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}

   }

 }}>

 <section className={styles.dialog}>

  <header className={styles.header}><span>YOUR FIRST VISIT · {step+1} OF {steps.length}</span><Button variant="secondary" size="sm" disabled={saving} onClick={onFinish}>Skip tour</Button></header>

  <progress value={step+1} max={steps.length} aria-label="Tutorial progress" />

  <h1 id="tutorial-title" tabIndex={-1} ref={heading}>{steps[step]}</h1>

  {step===0 && <><p className={styles.lead}>Welcome to your vault. There is no perfect way to begin.</p><p>Collect equipment you like, learn the card table, and enjoy small discoveries. This quick tour shows the essentials and gives you a free practice preview.</p><p className={styles.note}>No coins are spent or awarded during the tutorial. You can replay it from the footer at any time.</p></>}

  {step===1 && <><p className={styles.lead}>Start with what is already yours.</p><ol className={styles.list}><li><strong>Claim your daily coin crate</strong><p>Currently {dailyCoins.toLocaleString()} coins each day. Claiming it also completes a simple quest.</p></li><li><strong>Open your three free daily crates</strong><p>Find them in Daily crates. Check the rarity odds before opening; each roll is independent.</p></li><li><strong>Claim completed quests</strong><p>The Quests page rewards participation and discovery. You never need to win a hand to complete the MVP card quests.</p></li></ol><p className={styles.note}>Daily rewards reset in America/New_York. New accounts also receive 500 starting coins. Missed days do not remove your collection.</p></>}

  {step===2 && <><p className={styles.lead}>Two main ways to play, one collection to build.</p><ul className={styles.modeList}><li><ModeIcon mode="earn"/><div><strong>Earn your loot</strong><p>Jack No Black is blackjack against a dealer. The River is poker against Nova and Atlas. Start with 10% of your coins or more; stakes can be lost.</p></div></li><li><ModeIcon mode="crates"/><div><strong>Crates</strong><p>Buy a crate, inspect its odds, and open it for an item. Rare items are exciting, but no result is guaranteed.</p></div></li></ul><p>Shop gives you an exact item at a stated price. Inventory holds your equipment. Quests tracks your progress.</p><p className={styles.note}>Extra Modes contains Sandbox practice and collection shortcuts. Banners and crafting are future modes and are kept out of the MVP navigation.</p></>}

  {step===3 && <><p className={styles.lead}>Read the hand, then choose your move.</p><p>Check advances a street. Raise commits more coins. If an AI raises, call or fold. Folding is a valid choice. The best five-card hand wins; ties split the pot.</p>

   <div className={styles.options}><label><input type="checkbox" checked={sound} onChange={event=>setSound(event.target.checked)}/>Preview music and sounds</label><label><input type="checkbox" checked={motion && !reduced} disabled={reduced} onChange={event=>setMotion(event.target.checked)}/>Preview screen shaking</label></div>

   <div className={styles.preview} ref={scene}><RiverAtmosphere key={demo} round={reveal || watched ? DEMO_RESULT : round} sceneRef={scene} contained revealing={reveal} audioAllowed={sound} motionAllowed={motion}/>

    {demo===4 && <HandFaithSequence round={round} username="traveler" tableRef={scene} contained audioAllowed={sound} motionAllowed={motion}/>}

    <div className={`${styles.table} ${demo===4 ? styles.scattered : ""}`}><div className={styles.seats}>{round.opponents.map(seat=><span key={seat.name}><OpponentIcon name={seat.name}/>{seat.name}</span>)}</div><Cards cards={round.board}/><span>Your hand · {round.hand}</span><Cards cards={round.cards}/></div>

    <span className={styles.practiceLabel}>PRACTICE SNAPSHOT · {round.stage}</span>

   </div>

   <div className={styles.demoCopy} aria-live="polite"><strong>{round.title} · {demo+1} of {DEMO_ROUNDS.length}</strong><p>{round.text}</p></div>

   <div className={styles.controls}><Button variant="secondary" disabled={demo===0} onClick={()=>{setWatched(false);setDemo(value=>value-1);}}>Previous effect</Button>{demo<DEMO_ROUNDS.length-1 ? <Button onClick={()=>{setWatched(false);setDemo(value=>value+1);}}>Next effect</Button> : <Button onClick={()=>setReveal(true)}>{watched ? "Replay sky reveal" : "Preview sky reveal"}</Button>}</div>

   <p className={styles.note}>These are separate scripted snapshots, not a rigged live hand. Strong effects do not show your chance of winning. Sound also respects the site mute setting. {reduced ? "Your reduced-motion preference is active." : "Shaking is optional."}</p>

  </>}

  {step===4 && <><p className={styles.lead}>Keep the things that make your vault yours.</p><p>Your Inventory holds owned items. Selling removes an owned item and returns the listed coin value. Your permanent Collection keeps the discovery even after a sale.</p><p>Shop purchases guarantee the pictured item. Extraordinary pieces cost 12,000 coins; ???? pieces cost 60,000. Saving daily rewards is a steady alternative to risking coins at the table.</p><p className={styles.note}>At {dailyCoins.toLocaleString()} daily coins, saving from zero takes about {Math.ceil(12000/dailyCoins)} claims for Extraordinary or {Math.ceil(60000/dailyCoins)} for ????. Quest rewards can shorten this; purchases and stakes can lengthen it.</p></>}

  {step===5 && <><p className={styles.lead}>Your next step is simple: claim your daily coins.</p><p>Then open a free crate or visit a mode that interests you. There is no need to rush, chase a loss, or put all your coins on one hand.</p><p className={styles.note}>Use Sound and Motion controls in the footer. Reduced motion removes shaking and shortens winner reveals. Your current live hand is saved if you leave and return.</p></>}

  {error && <p role="alert" className={styles.error}>{error}</p>}

  <footer className={styles.footer}><Button variant="secondary" disabled={step===0 || saving} onClick={()=>setStep(value=>value-1)}>Back</Button><span>You can take your time.</span><Button disabled={saving} onClick={()=>step===steps.length-1 ? onFinish() : setStep(value=>value+1)}>{saving ? "Saving…" : step===steps.length-1 ? "Go to my vault" : "Continue"}</Button></footer>

 </section>

 {reveal && <ShowdownCutscene round={DEMO_RESULT} onDone={endReveal} audioAllowed={sound} motionAllowed={motion} practice/>}

 </div>,document.body);

}
