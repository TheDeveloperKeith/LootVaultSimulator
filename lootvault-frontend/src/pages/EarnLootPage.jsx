import GemIcon from "../components/GemIcon";
import { useCallback, useEffect, useRef, useState } from "react";

import RelicMoveEffect from "../earn/RelicMoveEffect";
import { readLoadout, eligibleRelic } from "../items/loadout";
import { resolveItemDesign } from "../items/designs";
import { getInventory } from "../api/game";
import { Link, useSearchParams } from "react-router-dom";
import { actOnHand, getEarnState, startHand } from "../api/earn";
import { useWallet } from "../wallet/WalletContext";
import Button from "../components/Button";
import PlayingCard from "../components/PlayingCard";
import DailyCoinCrate from "../components/DailyCoinCrate";
import RiverAtmosphere from "../earn/RiverAtmosphere";
import ShowdownCutscene from "../earn/ShowdownCutscene";
import { useAuth } from "../auth/AuthContext";
import styles from "./EarnLootPage.module.css";
import { pokerAtmosphere } from "../earn/pokerAtmosphere";
import OpponentIcon from "../components/OpponentIcon";
import { playRoundResult } from "../sfx";
import { pokerButtonPitch } from "../earn/pokerButtonPitch";
import HandFaithSequence from "../earn/HandFaithSequence";

const MODES = { BLACKJACK: { name: "Jack No Black", subtitle: "Blackjack · you vs. the dealer", symbol: "♠", rules: "Closest to 21 wins. Aces count as 1 or 11. The dealer stands on all 17s. A win returns 2× your stake, natural blackjack 2.5× (rounded down), and a push returns your stake. No splits, doubles, or insurance." }, HOLDEM: { name: "The River", subtitle: "Flop-start Hold’em · two AI opponents", symbol: "♥", rules: "Two hole cards each, three community cards to start. Every seat antes your entry stake. Check or raise on the flop, turn, and river; the AI seats call or fold your raises. AI opponents can raise after you check. Call their raise or fold before play continues; the other active AI calls. No blinds in this fast variant. Best five-card hand wins the pot; ties split it. Folded coins stay in the pot." } };
const format = value => Number(value || 0).toLocaleString();
function Cards({ cards, prefix }) { return <div className={styles.cards} data-scatter-source>{cards.map((card, index) => <PlayingCard key={`${prefix}-${index}-${card?.rank}-${card?.suit}`} card={card} index={index} />)}</div>; }

export default function EarnLootPage() {
    const { player } = useAuth();
    const [relics,setRelics] = useState([]);
    const [moveEffect,setMoveEffect] = useState(null);
    useEffect(()=>{let alive=true;getInventory().then(items=>{if(alive)setRelics(items.filter(eligibleRelic));}).catch(()=>{});return()=>{alive=false;};},[]);
    const [showInfo, setShowInfo] = useState(false);
    const infoDialog = useRef(null);
    useEffect(() => { if (showInfo) infoDialog.current?.showModal(); }, [showInfo]);
    const [testHand, setTestHand] = useState("");
    const [testResult, setTestResult] = useState("WIN");
    const { wallet, refresh: refreshWallet } = useWallet();
    const [data, setData] = useState(null);
    const [searchParams] = useSearchParams();
    const [game, setGame] = useState(() => searchParams.get("game") === "HOLDEM" ? "HOLDEM" : "BLACKJACK");
    const [selectedCurrency,setSelectedCurrency]=useState("SOFT");
    const [percent, setPercent] = useState(10);
    const [raise, setRaise] = useState("10");
    const [busy, setBusy] = useState(false);
    const [buttonPitch, setButtonPitch] = useState(1);
    const sounded = useRef(new Set());
    const [error, setError] = useState("");
    const [reveal, setReveal] = useState(null);
    const endReveal = useCallback(() => setReveal(null), []);
    const startRequest = useRef(null);
    const sceneRef = useRef(null);
    const load = useCallback(async () => {
        try { const next = await getEarnState(); setData(next); if (next.round && next.round.stage !== "COMPLETE") {setGame(next.round.game);setSelectedCurrency(next.round.currency||"SOFT");} setError(""); }
        catch (error) { setError(error.message || "Couldn't load the card tables."); }
    }, []);
    useEffect(() => { let active = true; Promise.resolve().then(() => { if (active) return load(); }); return () => { active = false; }; }, [load]);
    const active = data?.round && data.round.stage !== "COMPLETE";
    const currency = active ? data.round.currency || "SOFT" : selectedCurrency;
    const unit = currency === "HARD" ? "gems" : "coins";
    const round = data?.round?.game === game && (data.round.currency || "SOFT") === currency ? data.round : null;
    const balance = currency === "HARD" ? wallet?.gemBalance ?? wallet?.hardBalance ?? 0 : wallet?.softBalance ?? 0;
    const stake = Math.ceil(balance * percent / 100);
    const complete = round?.stage === "COMPLETE";
    const tension = round && !complete ? round.pressure : 0;
    const handIntensity = pokerAtmosphere(round).level;
    const [actionPeak, setActionPeak] = useState({ id:null, level:0 });
    if (actionPeak.id !== round?.id) setActionPeak({ id:round?.id, level:handIntensity });
    else if (handIntensity > actionPeak.level) setActionPeak({ id:round?.id, level:handIntensity });
    const extremeActions = !complete && Math.max(handIntensity, actionPeak.id === round?.id ? actionPeak.level : 0) >= 3;
    const stages = game === "HOLDEM" ? ["Flop", "Turn", "River", "Reveal"] : ["Your hand", "Dealer", "Reveal"];
    const stageIndex = !round ? -1 : complete ? stages.length - 1 : game === "HOLDEM" ? ["FLOP", "TURN", "RIVER"].indexOf(round.stage) : 0;
    const stageLabel = !round ? "Ready to deal" : complete ? "Hand complete" : game === "BLACKJACK" ? "Your move" : `${round.stage.charAt(0)}${round.stage.slice(1).toLowerCase()}`;
    const net = complete ? round.payout - round.committed : 0;

    function acceptState(next) {
        setButtonPitch(pokerButtonPitch(data?.round, next.round));
        if (next.round?.stage === "COMPLETE" && (data?.round?.id !== next.round.id || data?.round?.stage !== "COMPLETE") && !sounded.current.has(next.round.id)) {
            sounded.current.add(next.round.id);
            if (next.round.showdown?.close || next.round.showdown?.extreme) setReveal(next.round);
            else playRoundResult(next.round.outcome);
        }
        setData(next);
    }
    async function transact(operation) {
        if (busy) return;
        setBusy(true); setError("");
        try {
            const next = await operation();
            acceptState(next); startRequest.current = null;
        }
        catch (error) {
            setError(error.message || "Couldn't update this hand.");
            // A lost response may follow a committed transaction. Recover authoritative state.
            try { const next = await getEarnState(); acceptState(next); if (next.round?.stage !== "COMPLETE" && next.round) {setGame(next.round.game);setSelectedCurrency(next.round.currency||"SOFT");} } catch { /* Keep the retryable error. */ }
        } finally { await refreshWallet(); setBusy(false); }
    }
    function move(action, amount) {
        const loadout=readLoadout(player?.username);
        const type=["CHECK","STAND","FOLD"].includes(action) ? "shield" : "sword";
        const item=loadout.enabled && (relics.find(item=>item.id===loadout[type]) || relics.find(item=>item.id===loadout[type === "sword" ? "shield" : "sword"]));
        if(item){const design=resolveItemDesign(item.itemName);setMoveEffect({key:crypto.randomUUID(),type:design.type,variant:design.effect,color:design.color === "currentColor" ? "#c4a0ef" : design.color});} else setMoveEffect(null);
        return actOnHand(round,action,amount);
    }
    function deal() {
        if (!startRequest.current || startRequest.current.game !== game || startRequest.current.stake !== stake || startRequest.current.currency !== currency)
            startRequest.current = { id: crypto.randomUUID(), game, stake, currency };
        transact(() => startHand(game, stake, startRequest.current.id, player?.devMode && game === "HOLDEM" && testHand ? testHand : undefined, player?.devMode && game === "HOLDEM" && testHand ? testResult : undefined, currency));
    }

    const controls = (<aside className={styles.controls} aria-label="Hand actions">
                {active ? <><h2>Your move</h2><p>{format(round?.committed)} {unit} committed to this hand.</p><div className={`${styles.actionStack} ${extremeActions ? styles.actionGlow : ""}`}>{round?.actions.includes("HIT") && <><Button soundPitch={game === "HOLDEM" ? buttonPitch : 1} disabled={busy} onClick={() => transact(() => move("HIT"))}>Hit · one more card</Button><Button soundPitch={game === "HOLDEM" ? buttonPitch : 1} variant="secondary" disabled={busy} onClick={() => transact(() => move("STAND"))}>Stand · hold your total</Button></>}{round?.actions.includes("CALL") && <><Button soundPitch={buttonPitch} disabled={busy || balance < round.toCall} onClick={() => transact(() => move("CALL"))}>Call · {format(round.toCall)} {unit}</Button><Button soundPitch={buttonPitch} variant="danger" disabled={busy} onClick={() => transact(() => move("FOLD"))}>Fold · leave the pot</Button></>}{round?.actions.includes("CHECK") && <><Button soundPitch={game === "HOLDEM" ? buttonPitch : 1} disabled={busy} onClick={() => transact(() => move("CHECK"))}>{round.stage === "RIVER" ? "Check · showdown" : "Check · next card"}</Button><label className={styles.field}>Additional raise<input type="number" min="1" max={balance} step="1" value={raise} onChange={event => setRaise(event.target.value)} disabled={busy || balance === 0} /></label><Button soundPitch={buttonPitch} variant="secondary" disabled={busy || !Number.isSafeInteger(Number(raise)) || Number(raise) < 1 || Number(raise) > balance} onClick={() => transact(() => move("RAISE", Number(raise)))}>Raise {format(raise)} {unit}</Button><Button soundPitch={buttonPitch} variant="danger" disabled={busy} onClick={() => transact(() => move("FOLD"))}>Fold · leave the pot</Button></>}</div><small className={styles.note}>Your hand is saved. You can leave and return to finish it.</small></> : <><div className={styles.stakeHeading}><h2>{complete ? "Next hand?" : "Choose your stake"}</h2><div className={styles.currencyChoice} aria-label="Stake currency"><button disabled={busy} aria-pressed={currency==="SOFT"} onClick={()=>{setSelectedCurrency("SOFT");startRequest.current=null;}}>Coins</button><button disabled={busy} aria-pressed={currency==="HARD"} onClick={()=>{setSelectedCurrency("HARD");startRequest.current=null;}}><GemIcon size={25}/> Gems</button></div></div><p>Commit at least 10% of your current {unit}. Choose all-in to put them all on the table.</p><div className={styles.stake}><strong>{format(stake)}</strong><span>{unit} · {percent}% of your balance</span></div><label className={styles.range}>Stake percentage<input type="range" min="10" max="100" step="1" value={percent} onChange={event => setPercent(Number(event.target.value))} disabled={busy || !wallet} /></label><div className={styles.presets}>{[10,25,50,100].map(value => <button key={value} aria-pressed={percent === value} disabled={busy} onClick={() => setPercent(value)}>{value === 100 ? "All-in" : `${value}%`}</button>)}</div><Button disabled={busy || !data || !wallet || stake <= 0 || stake > 1_000_000_000_000} onClick={deal}>{busy ? "Dealing…" : `Commit ${unit} & deal`}</Button>{balance === 0 && wallet && <small className={styles.note}>{currency === "HARD" ? "Claim your daily gems or trade a Mystery Crate to get back to the table." : "Open your daily coin crate or sell an inventory item to get back to the table."}</small>}<p className={styles.note}>Stake is deducted when the hand starts. Returns include your original stake. In-game currency only; no cash payouts.</p></>}
                <details className={styles.rules}><summary>How this table works</summary><p>{MODES[game].rules.replaceAll("coins",unit)}</p></details>
            </aside>);

    const pokerActions = active && game === "HOLDEM" && round && (
        <nav className={styles.boardActions} aria-label="Poker hand actions" aria-busy={busy}>
            <div className={styles.moveCaption}><span>Your move</span><small>{format(round.committed)} committed · hand saved</small></div>
            <div className={`${styles.boardButtons} ${extremeActions ? styles.actionGlow : ""}`}>
                {round.actions.includes("CALL") && <Button soundPitch={buttonPitch} disabled={busy || balance < round.toCall} onClick={() => transact(() => move("CALL"))} className={`${styles.wordAction} ${styles.checkAction}`}>CALL <small>{format(round.toCall)}</small></Button>}
                {round.actions.includes("CHECK") && <>
                    <Button soundPitch={buttonPitch} disabled={busy} onClick={() => transact(() => move("CHECK"))} className={`${styles.wordAction} ${styles.checkAction}`}>CHECK</Button>
                    <div className={styles.raiseControl}>
                        <label htmlFor="poker-raise">{unit}</label>
                        <input id="poker-raise" aria-label={`Additional raise in ${unit}`} type="number" min="1" max={balance} step="1" value={raise} disabled={busy || balance === 0} onChange={event => setRaise(event.target.value)} />
                        <Button soundPitch={buttonPitch} variant="secondary" disabled={busy || !Number.isSafeInteger(Number(raise)) || Number(raise) < 1 || Number(raise) > balance} onClick={() => transact(() => move("RAISE", Number(raise)))} className={styles.wordAction}>RAISE</Button>
                    </div>
                </>}
                {round.actions.includes("FOLD") && <Button soundPitch={buttonPitch} variant="danger" disabled={busy} onClick={() => transact(() => move("FOLD"))} className={`${styles.wordAction} ${styles.foldAction}`}>FOLD</Button>}
            </div>
        </nav>
    );

    return <div className={`${styles.page} ${styles.gamePage}`} ref={sceneRef} data-game-page="true">
        {wallet?.unlimited && <p className={styles.atmosphere}>Developer playground · unlimited test currency. Stakes use a 1,000,000-coin reference balance and never reduce your wallet.</p>}
        <RiverAtmosphere key={`atmosphere-${round?.id || "waiting"}`} round={round} sceneRef={sceneRef} revealing={Boolean(reveal)} showStatus={false} />
        {round && !complete && ["Four of a kind","Straight flush"].includes(round.hand) && <HandFaithSequence key={`faith-${round.id}`} round={round} username={player?.username} tableRef={sceneRef} />}
        {reveal && <ShowdownCutscene round={reveal} onDone={endReveal} />}


        <div className={styles.tabs} aria-label="Choose a card mode">{Object.entries(MODES).map(([id, mode]) => <button key={id} disabled={busy || (active && data.round.game !== id)} aria-pressed={game === id} onClick={() => { setGame(id); setError(""); }}><span aria-hidden="true">{mode.symbol}</span><span>{mode.name}<small>{mode.subtitle}</small></span></button>)}</div>
        {error && <div className={styles.error} role="alert">{error} <button onClick={load} disabled={busy}>Refresh table</button></div>}
        {!data && !error && <p role="status">Getting your seat ready…</p>}
        <div className={`${styles.layout} ${styles.gameLayout}`}>
            <section className={`${styles.table} ${styles.gameTable} ${game === "BLACKJACK" ? styles.blackjackTable : styles.pokerCards} ${!complete && ["Four of a kind","Straight flush"].includes(round?.hand) ? styles.faithCards : ""} ${tension >= 75 ? styles.closeGame : ""} ${complete && net > 0 ? styles.win : ""} ${complete && net < 0 ? styles.loss : ""}`} style={{ "--pressure": `${tension / 100}` }} aria-label={`${MODES[game].name} table`}>
                <RelicMoveEffect effect={moveEffect}/><div className={styles.tableHeader}><div><span className={styles.eyebrow}>{stageLabel}</span><h2>{MODES[game].name}</h2></div><ol className={styles.stageTrack} aria-label="Hand stages">{stages.map((stage, index) => <li key={stage} aria-current={index === stageIndex ? "step" : undefined} className={index < stageIndex ? styles.stageDone : ""}>{stage}</li>)}</ol><span className={styles.pot}>{game === "HOLDEM" ? "Pot" : "Your stake"}<strong>{format(round ? game === "HOLDEM" ? round.pot : round.stake : stake)} <small>{unit}</small></strong></span></div>
                {round ? <>
                    <div className={styles.opponents}>{round.opponents.map((seat, index) => <div className={`${styles.seat} ${seat.folded ? styles.folded : ""}`} key={seat.name}><div className={styles.avatar}><OpponentIcon name={seat.name} /></div><span className={styles.seatName}>{seat.name}{seat.folded ? " · folded" : ""}</span><Cards cards={seat.cards} prefix={`opponent-${round.id}-${index}`} /><small>{seat.total != null ? `Total ${seat.total}` : seat.hand || "Cards hidden"}</small></div>)}</div>
                    {game === "HOLDEM" && <div className={styles.community}><span>Community cards</span><Cards cards={[...round.board, ...Array(5 - round.board.length).fill(null)]} prefix={`board-${round.id}`} /></div>}
                    {game === "BLACKJACK" && <div className={styles.feltLabel} aria-hidden="true"><strong>BLACKJACK</strong><span>Dealer stands on 17 · blackjack pays 3:2</span></div>}
                    <div className={styles.player}><span className={styles.seatName}>You <span className={styles.handBadge}>{round.total != null ? `Total ${round.total}` : round.hand}</span></span><Cards cards={round.cards} prefix={`player-${round.id}`} /></div>
                    <p className={styles.message} role="status">{round.message}</p>
                    {!complete && <div className={styles.pressure}><span>{tension >= 75 ? "Down to the wire" : game === "HOLDEM" ? "The table is heating up" : "Make your move"}</span><div><i /></div><small>{game === "BLACKJACK" ? "Tension reflects your total, not your win chance." : "Tension rises toward showdown, not your win chance."}</small></div>}
                    {complete && <div className={styles.result} role="status"><span>{round.outcome === "WIN" ? "✦" : round.outcome === "LOSS" ? "↘" : "↔"}</span><strong>{net > 0 ? "+" : ""}{format(net)} {unit}</strong><small>{format(round.payout)} returned · {format(round.committed)} committed</small><Link to="/progression">Check your quest progress →</Link></div>}
                    {complete && net > 0 && <div className={styles.sparkles} aria-hidden="true">{Array.from({length: 12}, (_, index) => <i key={index} style={{ "--i": index }} />)}</div>}
                </> : <div className={styles.emptyTable}><div className={styles.fannedCards}><PlayingCard /><PlayingCard /><PlayingCard /></div><h3>A little nerve. A little luck.</h3><p>{game === "BLACKJACK" ? "Just you, the dealer, and a race to 21." : "Three seats. Five community cards. One pot."}</p><span>In-game {unit} only · every stake can be lost</span></div>}
                {active ? game === "HOLDEM" ? pokerActions : <nav className={styles.boardActions} aria-label="Blackjack hand actions" aria-busy={busy}>
                    <div className={styles.moveCaption}><small>{format(round?.committed)} committed · hand saved</small></div>
                    <div className={styles.boardButtons}>
                        <Button className={styles.wordAction} disabled={busy} onClick={() => transact(() => move("HIT"))}>HIT</Button>
                        <Button className={styles.wordAction} variant="secondary" disabled={busy} onClick={() => transact(() => move("STAND"))}>STAND</Button>
                    </div>
                </nav> : <div className={styles.tableSetup}>{controls}</div>}
            </section>
        </div>
        <div className={styles.settingsDock}><button className={styles.tableSettings} aria-label="Open table settings" aria-haspopup="dialog" onClick={() => setShowInfo(true)}><span aria-hidden="true">⚙</span> Settings</button></div>
        {showInfo && <dialog ref={infoDialog} className={styles.infoDialog} aria-labelledby="poker-info-title" onCancel={() => setShowInfo(false)} onClose={() => setShowInfo(false)}>
            <div className={styles.infoHeading}><h2 id="poker-info-title">Table settings & rewards</h2><button autoFocus className={styles.infoLink} onClick={() => { infoDialog.current.close(); setShowInfo(false); }}>Close</button></div>
            <p><Link to="/settings">Sound, volume & reduced motion settings ↗</Link></p>
            <div className={styles.stats}><div><span>Available {unit}</span><strong>{wallet ? format(balance) : "—"}</strong></div><div><span>Hands finished</span><strong>{data ? format(data.stats.handsPlayed) : "—"}</strong></div><div><span>Wins</span><strong>{data ? format(data.stats.wins) : "—"}</strong></div><div><span>Net table {unit}</span><strong>{data ? `${(currency==="HARD"?data.stats.netGems:data.stats.netCoins) > 0 ? "+" : ""}${format(currency==="HARD"?data.stats.netGems:data.stats.netCoins)}` : "—"}</strong></div></div>
            <p>Coin and gem hands use the same payouts. Stake 10–100% of the selected balance; the whole stake can be lost. Claim 5 daily gems in the lobby, or exchange an unopened Mystery Crate for 10 gems.</p><DailyCoinCrate />
            <h3>How {MODES[game].name} works</h3><p>{MODES[game].rules.replaceAll("coins",unit)}</p>
            <Link to="/progression">Your quests</Link>
            {player?.devMode && game === "HOLDEM" && <section className={styles.controls} aria-label="Developer test deals"><h2>Test the sky</h2><p>Choose an early hand and check through all streets to see the selected result.</p><label className={styles.field}>Opening hand<select disabled={busy || active} value={testHand} onChange={event => { setTestHand(event.target.value); startRequest.current=null; }}><option value="">Random deal</option><option value="FULL_HOUSE">Full house</option><option value="QUADS">Four of a kind</option><option value="STRAIGHT_FLUSH">Straight flush</option></select></label><label className={styles.field}>Test result<select disabled={busy || active} value={testResult} onChange={event => { setTestResult(event.target.value); startRequest.current=null; }}><option value="WIN">You win</option><option value="LOSS">Nova wins</option></select></label><small>Developer account only · raises or folding can change the result.</small></section>}
        </dialog>}
        <div className={styles.loop}><span>Daily crate</span><i>→</i><span>Play a hand</span><i>→</i><span>Complete quests</span><i>→</i><Link to="/crates">Build your vault ↗</Link></div>
    </div>;
}
