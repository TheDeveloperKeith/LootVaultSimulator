import { useCallback, useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";
import { useReducedMotion, setReducedMotion } from "../preferences/motion";
import { Link } from "react-router-dom";
import { actOnHand, getEarnState, startHand } from "../api/earn";
import { useWallet } from "../wallet/WalletContext";
import Button from "../components/Button";
import PlayingCard from "../components/PlayingCard";
import DailyCoinCrate from "../components/DailyCoinCrate";
import RiverAtmosphere from "../earn/RiverAtmosphere";
import ShowdownCutscene from "../earn/ShowdownCutscene";
import { useAuth } from "../auth/AuthContext";
import styles from "./EarnLootPage.module.css";
import { pokerAtmosphere, riverMusicTier } from "../earn/pokerAtmosphere";
import OpponentIcon from "../components/OpponentIcon";
import { playRoundResult } from "../sfx";
import { pokerButtonPitch } from "../earn/pokerButtonPitch";
import HandFaithSequence from "../earn/HandFaithSequence";

const MODES = { BLACKJACK: { name: "Jack No Black", subtitle: "Blackjack · you vs. the dealer", symbol: "♠", rules: "Closest to 21 wins. Aces count as 1 or 11. The dealer stands on all 17s. A win returns 2× your stake, natural blackjack 2.5× (rounded down), and a push returns your stake. No splits, doubles, or insurance." }, HOLDEM: { name: "The River", subtitle: "Flop-start Hold’em · two AI opponents", symbol: "♥", rules: "Two hole cards each, three community cards to start. Every seat antes your entry stake. Check or raise on the flop, turn, and river; the AI seats call or fold your raises. AI opponents can raise after you check. Call their raise or fold before play continues; the other active AI calls. No blinds in this fast variant. Best five-card hand wins the pot; ties split it. Folded coins stay in the pot." } };
const format = value => Number(value || 0).toLocaleString();
function Cards({ cards, prefix }) { return <div className={styles.cards} data-scatter-source>{cards.map((card, index) => <PlayingCard key={`${prefix}-${index}-${card?.rank}-${card?.suit}`} card={card} index={index} />)}</div>; }

export default function EarnLootPage() {
    const { player } = useAuth();
    const reducedMotion = useReducedMotion();
    const [testHand, setTestHand] = useState("");
    const [testResult, setTestResult] = useState("WIN");
    const { wallet, refresh: refreshWallet } = useWallet();
    const [data, setData] = useState(null);
    const [game, setGame] = useState("BLACKJACK");
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
        try { const next = await getEarnState(); setData(next); if (next.round && next.round.stage !== "COMPLETE") setGame(next.round.game); setError(""); }
        catch (error) { setError(error.message || "Couldn't load the card tables."); }
    }, []);
    useEffect(() => { let active = true; Promise.resolve().then(() => { if (active) return load(); }); return () => { active = false; }; }, [load]);
    const round = data?.round?.game === game ? data.round : null;
    const active = data?.round && data.round.stage !== "COMPLETE";
    const balance = wallet?.softBalance ?? 0;
    const stake = Math.ceil(balance * percent / 100);
    const complete = round?.stage === "COMPLETE";
    const tension = round && !complete ? round.pressure : 0;
    const handIntensity = pokerAtmosphere(round).level;
    const [actionPeak, setActionPeak] = useState({ id:null, level:0 });
    if (actionPeak.id !== round?.id) setActionPeak({ id:round?.id, level:handIntensity });
    else if (handIntensity > actionPeak.level) setActionPeak({ id:round?.id, level:handIntensity });
    const catastrophic = !complete && riverMusicTier(round) === 2;
    const controlsRef = useRef(null);
    useEffect(() => {
        if (catastrophic) controlsRef.current?.querySelector(`.${styles.actionStack} button:not(:disabled)`)?.focus({preventScroll:true});
    }, [catastrophic]);
    const extremeActions = !complete && Math.max(handIntensity, actionPeak.id === round?.id ? actionPeak.level : 0) >= 3;
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
            try { const next = await getEarnState(); acceptState(next); if (next.round?.stage !== "COMPLETE" && next.round) setGame(next.round.game); } catch { /* Keep the retryable error. */ }
        } finally { await refreshWallet(); setBusy(false); }
    }
    function deal() {
        if (!startRequest.current || startRequest.current.game !== game || startRequest.current.stake !== stake)
            startRequest.current = { id: crypto.randomUUID(), game, stake };
        transact(() => startHand(game, stake, startRequest.current.id, player?.devMode && game === "HOLDEM" && testHand ? testHand : undefined, player?.devMode && game === "HOLDEM" && testHand ? testResult : undefined));
    }

    const controls = (<aside ref={controlsRef} className={`${styles.controls} ${catastrophic ? styles.criticalControls : ""}`} aria-label="Hand actions">
                {active ? <><div className={styles.criticalHeader}><h2>Your move</h2>{catastrophic && <Button variant="secondary" size="sm" onClick={() => setReducedMotion(!reducedMotion)}>{reducedMotion ? "Motion: Reduced" : "Reduce motion"}</Button>}</div><p>{format(round?.committed)} coins committed to this hand.</p><div className={`${styles.actionStack} ${extremeActions ? styles.actionGlow : ""}`}>{round?.actions.includes("HIT") && <><Button soundPitch={game === "HOLDEM" ? buttonPitch : 1} disabled={busy} onClick={() => transact(() => actOnHand(round, "HIT"))}>Hit · one more card</Button><Button soundPitch={game === "HOLDEM" ? buttonPitch : 1} variant="secondary" disabled={busy} onClick={() => transact(() => actOnHand(round, "STAND"))}>Stand · hold your total</Button></>}{round?.actions.includes("CALL") && <><Button soundPitch={buttonPitch} disabled={busy || balance < round.toCall} onClick={() => transact(() => actOnHand(round,"CALL"))}>Call · {format(round.toCall)} coins</Button><Button soundPitch={buttonPitch} variant="danger" disabled={busy} onClick={() => transact(() => actOnHand(round,"FOLD"))}>Fold · leave the pot</Button></>}{round?.actions.includes("CHECK") && <><Button soundPitch={game === "HOLDEM" ? buttonPitch : 1} disabled={busy} onClick={() => transact(() => actOnHand(round, "CHECK"))}>{round.stage === "RIVER" ? "Check · showdown" : "Check · next card"}</Button><label className={styles.field}>Additional raise<input type="number" min="1" max={balance} step="1" value={raise} onChange={event => setRaise(event.target.value)} disabled={busy || balance === 0} /></label><Button soundPitch={buttonPitch} variant="secondary" disabled={busy || !Number.isSafeInteger(Number(raise)) || Number(raise) < 1 || Number(raise) > balance} onClick={() => transact(() => actOnHand(round, "RAISE", Number(raise)))}>Raise {format(raise)} coins</Button><Button soundPitch={buttonPitch} variant="danger" disabled={busy} onClick={() => transact(() => actOnHand(round, "FOLD"))}>Fold · leave the pot</Button></>}</div><small className={styles.note}>Your hand is saved. You can leave and return to finish it.</small></> : <><h2>{complete ? "Next hand?" : "Choose your stake"}</h2><p>Commit at least 10% of your current coins. Choose all-in to put them all on the table.</p><div className={styles.stake}><strong>{format(stake)}</strong><span>coins · {percent}% of your balance</span></div><label className={styles.range}>Stake percentage<input type="range" min="10" max="100" step="1" value={percent} onChange={event => setPercent(Number(event.target.value))} disabled={busy || !wallet} /></label><div className={styles.presets}>{[10,25,50,100].map(value => <button key={value} aria-pressed={percent === value} disabled={busy} onClick={() => setPercent(value)}>{value === 100 ? "All-in" : `${value}%`}</button>)}</div><Button disabled={busy || !data || !wallet || stake <= 0 || stake > 1_000_000_000_000} onClick={deal}>{busy ? "Dealing…" : "Commit coins & deal"}</Button>{balance === 0 && wallet && <small className={styles.note}>Open your daily coin crate or sell an inventory item to get back to the table.</small>}<p className={styles.note}>Stake is deducted when the hand starts. Returns include your original stake. No coin purchases or cash payouts.</p></>}
                <details className={styles.rules}><summary>How this table works</summary><p>{MODES[game].rules}</p></details>
            </aside>);

    return <div className={styles.page} ref={sceneRef}>
        <header className={styles.header}><div><span className={styles.eyebrow}>THE COINS ARE YOURS. THE NEXT MOVE IS TOO.</span><h1 className={styles.title}>Earn your loot!</h1><p className={styles.sub}>Learn the table. Enjoy the moment. Every hand is a chance to grow.</p></div><Link to="/progression">Your quests ↗</Link></header>
        {wallet?.unlimited && <p className={styles.atmosphere}>Developer playground · unlimited test coins. Stakes use a 1,000,000-coin reference balance and never reduce your wallet.</p>}
        <DailyCoinCrate />
        <RiverAtmosphere key={`atmosphere-${round?.id || "waiting"}`} round={round} sceneRef={sceneRef} revealing={Boolean(reveal)} />
        {round && !complete && ["Four of a kind","Straight flush"].includes(round.hand) && <HandFaithSequence key={`faith-${round.id}`} round={round} username={player?.username} tableRef={sceneRef} />}
        {reveal && <ShowdownCutscene round={reveal} onDone={endReveal} />}
        {player?.devMode && game === "HOLDEM" && <section className={styles.controls} aria-label="Developer test deals"><h2>Test the sky</h2><p>Choose an early hand and check through all streets to see the selected result.</p><label className={styles.field}>Opening hand<select disabled={busy || active} value={testHand} onChange={event => { setTestHand(event.target.value); startRequest.current=null; }}><option value="">Random deal</option><option value="FULL_HOUSE">Full house</option><option value="QUADS">Four of a kind</option><option value="STRAIGHT_FLUSH">Straight flush</option></select></label><label className={styles.field}>Test result<select disabled={busy || active} value={testResult} onChange={event => { setTestResult(event.target.value); startRequest.current=null; }}><option value="WIN">You win</option><option value="LOSS">Nova wins</option></select></label><small>Developer account only · raises or folding can change the result.</small></section>}
        <div className={styles.stats}><div><span>Available coins</span><strong>{wallet ? format(balance) : "—"}</strong></div><div><span>Hands finished</span><strong>{data ? format(data.stats.handsPlayed) : "—"}</strong></div><div><span>Wins</span><strong>{data ? format(data.stats.wins) : "—"}</strong></div><div><span>Net table coins</span><strong>{data ? `${data.stats.netCoins > 0 ? "+" : ""}${format(data.stats.netCoins)}` : "—"}</strong></div></div>
        <div className={styles.tabs} aria-label="Choose a card mode">{Object.entries(MODES).map(([id, mode]) => <button key={id} disabled={busy || (active && data.round.game !== id)} aria-pressed={game === id} onClick={() => { setGame(id); setError(""); }}><span aria-hidden="true">{mode.symbol}</span><span>{mode.name}<small>{mode.subtitle}</small></span></button>)}</div>
        {error && <div className={styles.error} role="alert">{error} <button onClick={load} disabled={busy}>Refresh table</button></div>}
        {!data && !error && <p role="status">Getting your seat ready…</p>}
        <div className={styles.layout}>
            <section className={`${styles.table} ${!complete && ["Four of a kind","Straight flush"].includes(round?.hand) ? styles.faithCards : ""} ${tension >= 75 ? styles.closeGame : ""} ${complete && net > 0 ? styles.win : ""} ${complete && net < 0 ? styles.loss : ""}`} style={{ "--pressure": `${tension / 100}` }} aria-label={`${MODES[game].name} table`}>
                <div className={styles.tableHeader}><div><span className={styles.eyebrow}>{round ? round.stage.replaceAll("_", " ") : "YOUR SEAT IS READY"}</span><h2>{MODES[game].name}</h2></div><span className={styles.pot}>{game === "HOLDEM" ? "Pot" : "Your stake"}<strong>{format(round ? game === "HOLDEM" ? round.pot : round.stake : stake)} <small>coins</small></strong></span></div>
                {round ? <>
                    <div className={styles.opponents}>{round.opponents.map((seat, index) => <div className={`${styles.seat} ${seat.folded ? styles.folded : ""}`} key={seat.name}><div className={styles.avatar}><OpponentIcon name={seat.name} /></div><span className={styles.seatName}>{seat.name}{seat.folded ? " · folded" : ""}</span><Cards cards={seat.cards} prefix={`opponent-${round.id}-${index}`} /><small>{seat.total != null ? `Total ${seat.total}` : seat.hand || "Cards hidden"}</small></div>)}</div>
                    {game === "HOLDEM" && <div className={styles.community}><span>Community cards</span><Cards cards={[...round.board, ...Array(5 - round.board.length).fill(null)]} prefix={`board-${round.id}`} /></div>}
                    <div className={styles.player}><span className={styles.seatName}>You <span className={styles.handBadge}>{round.total != null ? `Total ${round.total}` : round.hand}</span></span><Cards cards={round.cards} prefix={`player-${round.id}`} /></div>
                    <p className={styles.message} role="status">{round.message}</p>
                    {!complete && <div className={styles.pressure}><span>{tension >= 75 ? "Down to the wire" : game === "HOLDEM" ? "The table is heating up" : "Make your move"}</span><div><i /></div><small>{game === "BLACKJACK" ? "Tension reflects your total, not your win chance." : "Tension rises toward showdown, not your win chance."}</small></div>}
                    {complete && <div className={styles.result} role="status"><span>{round.outcome === "WIN" ? "✦" : round.outcome === "LOSS" ? "↘" : "↔"}</span><strong>{net > 0 ? "+" : ""}{format(net)} coins</strong><small>{format(round.payout)} returned · {format(round.committed)} committed</small><Link to="/progression">Check your quest progress →</Link></div>}
                    {complete && net > 0 && <div className={styles.sparkles} aria-hidden="true">{Array.from({length: 12}, (_, index) => <i key={index} style={{ "--i": index }} />)}</div>}
                </> : <div className={styles.emptyTable}><div className={styles.fannedCards}><PlayingCard /><PlayingCard /><PlayingCard /></div><h3>A little nerve. A little luck.</h3><p>{game === "BLACKJACK" ? "Just you, the dealer, and a race to 21." : "Three seats. Five community cards. One pot."}</p><span>In-game coins only · every stake can be lost</span></div>}
            </section>
            {catastrophic ? createPortal(controls, document.body) : controls}
        </div>
        <div className={styles.loop}><span>Daily crate</span><i>→</i><span>Play a hand</span><i>→</i><span>Complete quests</span><i>→</i><Link to="/crates">Build your vault ↗</Link></div>
    </div>;
}
