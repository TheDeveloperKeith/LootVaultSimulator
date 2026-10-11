import type { Card, CardRank, CardSuit } from "../types/game";
import { useState } from "react";
import PlayingCard from "./PlayingCard";
import ItemIcon from "./ItemIcon";
import CrateIcon from "./CrateIcon";
import styles from "./LoginShowcase.module.css";

const card = (rank: CardRank, suit: CardSuit): Card => ({ rank, suit });
const modes = {
    poker: { label:"Poker", title:"Read the table. Play your hand.", copy:"Take on two AI opponents in The River. Check, raise, or fold as the community cards reveal your best hand." },
    blackjack: { label:"Blackjack", title:"One more card. Or hold your nerve.", copy:"Play Jack No Black against the dealer. Hit or stand to get closer to 21 without going over." },
    collection: { label:"Collect loot", title:"Open a crate. Find your next favorite.", copy:"Open crates, explore limited banners, and build a collection of original swords, shields, and elemental relics." },
};
type PreviewMode = keyof typeof modes;
export default function LoginShowcase() {
    const [mode, setMode] = useState<PreviewMode>("poker");
    const [step, setStep] = useState(0);
    const current = modes[mode];
    const board = [card(2,"SPADES"),card(7,"HEARTS"),card(13,"CLUBS"),step>=1 ? card(10,"SPADES") : null,step>=2 ? card(14,"DIAMONDS") : null];
    function next() { setStep(value => mode === "collection" ? (value + 1) % 2 : (value + 1) % 3); }
    return <section className={styles.showcase} aria-label="Explore LootVault gameplay">
        <header className={styles.header}><span className={styles.brand}>LootVault</span><span className={styles.badge}>PLAY · OPEN · COLLECT</span></header>
        <div className={styles.intro}><span className={styles.eyebrow}>CARD GAMES MEET LOOT COLLECTING</span><h1>Play a hand.<br /><span>Build your vault.</span></h1><p>Play poker and blackjack with in-game currency, then discover original gear in crates and limited banners.</p></div>
        <div className={styles.scene}>
            <div className={styles.sceneHeader}><span>{mode === "poker" ? "THE RIVER" : mode === "blackjack" ? "JACK NO BLACK" : "YOUR NEXT DISCOVERY"}</span><small>Interactive demo</small></div>
            {mode === "collection" ? <div className={styles.lootScene}>{step===0 ? <CrateIcon code="EXCELLENT" size={170}/> : <ItemIcon type={undefined} name="Sunbreak Oathblade" rarity="EXTRA_EXTRAORDINARY" size={170}/>}<strong>{step===0 ? "What’s inside?" : "Sunbreak Oathblade"}</strong><span>{step===0 ? "Crates contain collectible gear" : "???? · Elemental relic"}</span></div> : <div className={styles.table}>
                {mode === "poker" ? <><div className={styles.opponents}><span><i>N</i>Nova · AI</span><span><i>A</i>Atlas · AI</span></div><div className={styles.community} aria-label="Demo community cards">{board.map((value,i)=><PlayingCard key={i} card={value} index={i}/>)}</div><div className={styles.player}><div className={styles.hand}><PlayingCard card={card(14,"SPADES")}/><PlayingCard card={card(14,"HEARTS")}/></div><div><small>Your hand</small><strong>{step===2 ? "Three aces" : "Pair of aces"}</strong></div></div></> : <><div className={styles.dealer}><small>Dealer</small><div className={styles.hand}><PlayingCard card={card(9,"CLUBS")}/><PlayingCard card={step===2 ? card(9,"DIAMONDS") : null}/></div></div><div className={styles.player}><div className={styles.hand}><PlayingCard card={card(10,"SPADES")}/><PlayingCard card={card(7,"HEARTS")}/>{step>=1&&<PlayingCard card={card(3,"DIAMONDS")}/>}</div><div><small>Your total</small><strong>{step===0 ? "17" : "20"}</strong></div></div></>}
            </div>}
            <div className={styles.demoControls}><p role="status">{mode==="poker" ? step===0 ? "Check to reveal the turn card." : step===1 ? "One more check reveals the river." : "The river completes your three aces." : mode==="blackjack" ? step===0 ? "Try a hit to draw one more card." : step===1 ? "You have 20. Stand to see the dealer’s hand." : "20 beats the dealer’s 18." : step===0 ? "Preview an example crate reveal." : "An original relic for your collection."}</p><button type="button" onClick={next}>{mode==="collection" ? step===0 ? "Reveal a relic" : "See the crate again" : step===2 ? "Try again" : mode==="poker" ? "Check →" : step===0 ? "Hit →" : "Stand →"}</button></div>
        </div>
        <div className={styles.features} role="group" aria-label="Choose a gameplay preview">{(Object.keys(modes) as PreviewMode[]).map(key=><button key={key} type="button" aria-pressed={mode===key} onClick={()=>{setMode(key);setStep(0);}}>{modes[key].label}</button>)}</div>
        <div className={styles.description}><h2>{current.title}</h2><p>{current.copy}</p></div>
        <small className={styles.note}>Demo only · In-game coins and gems · No cash payouts</small>
    </section>;
}
