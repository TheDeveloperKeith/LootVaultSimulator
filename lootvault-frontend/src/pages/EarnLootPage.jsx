import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { actOnHand, getEarnState, startHand } from "../api/earn";
import { useWallet } from "../wallet/WalletContext";
import Button from "../components/Button";
import PlayingCard from "../components/PlayingCard";
import DailyCoinCrate from "../components/DailyCoinCrate";
import RiverAtmosphere from "../earn/RiverAtmosphere";
import styles from "./EarnLootPage.module.css";

const MODES = { BLACKJACK: { name: "Jack No Black", subtitle: "Blackjack · you vs. the dealer", symbol: "♠", rules: "Closest to 21 wins. Aces count as 1 or 11. The dealer stands on all 17s. A win returns 2× your stake, natural blackjack 2.5× (rounded down), and a push returns your stake. No splits, doubles, or insurance." }, HOLDEM: { name: "The River", subtitle: "Flop-start Hold’em · two AI opponents", symbol: "♥", rules: "Two hole cards each, three community cards to start. Every seat antes your entry stake. Check or raise on the flop, turn, and river; the AI seats call or fold your raises. No blinds or AI raises in this fast variant. Best five-card hand wins the pot; ties split it. Folded coins stay in the pot." } };
const format = value => Number(value || 0).toLocaleString();
function Cards({ cards, prefix }) { return <div className={styles.cards}>{cards.map((card, index) => <PlayingCard key={`${prefix}-${index}-${card?.rank}-${card?.suit}`} card={card} index={index} />)}</div>; }

export default function EarnLootPage() {
    const { wallet, refresh: refreshWallet } = useWallet();
    const [data, setData] = useState(null);
    const [game, setGame] = useState("BLACKJACK");
    const [percent, setPercent] = useState(10);
    const [raise, setRaise] = useState("10");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
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
    const net = complete ? round.payout - round.committed : 0;

    async function transact(operation) {
        if (busy) return;
        setBusy(true); setError("");
        try { setData(await operation()); startRequest.current = null; }
        catch (error) {
            setError(error.message || "Couldn't update this hand.");
            // A lost response may follow a committed transaction. Recover authoritative state.
            try { const next = await getEarnState(); setData(next); if (next.round?.stage !== "COMPLETE" && next.round) setGame(next.round.game); } catch { /* Keep the retryable error. */ }
        } finally { await refreshWallet(); setBusy(false); }
    }
    function deal() {
        if (!startRequest.current || startRequest.current.game !== game || startRequest.current.stake !== stake)
            startRequest.current = { id: crypto.randomUUID(), game, stake };
        transact(() => startHand(game, stake, startRequest.current.id));
    }

    return <div className={styles.page} ref={sceneRef}>
        <header className={styles.header}><div><span className={styles.eyebrow}>THE COINS ARE YOURS. THE NEXT MOVE IS TOO.</span><h1 className={styles.title}>Earn your loot!</h1><p className={styles.sub}>Conquer the despair of gambling — or be crushed with it.</p></div><Link to="/progression">Your quests ↗</Link></header>
        <DailyCoinCrate />
        <RiverAtmosphere round={round} sceneRef={sceneRef} />
        <div className={styles.stats}><div><span>Available coins</span><strong>{wallet ? format(balance) : "—"}</strong></div><div><span>Hands finished</span><strong>{data ? format(data.stats.handsPlayed) : "—"}</strong></div><div><span>Wins</span><strong>{data ? format(data.stats.wins) : "—"}</strong></div><div><span>Net table coins</span><strong>{data ? `${data.stats.netCoins > 0 ? "+" : ""}${format(data.stats.netCoins)}` : "—"}</strong></div></div>
        <div className={styles.tabs} aria-label="Choose a card mode">{Object.entries(MODES).map(([id, mode]) => <button key={id} disabled={busy || (active && data.round.game !== id)} aria-pressed={game === id} onClick={() => { setGame(id); setError(""); }}><span aria-hidden="true">{mode.symbol}</span><span>{mode.name}<small>{mode.subtitle}</small></span></button>)}</div>
        {error && <div className={styles.error} role="alert">{error} <button onClick={load} disabled={busy}>Refresh table</button></div>}
        {!data && !error && <p role="status">Getting your seat ready…</p>}
        <div className={styles.layout}>
            <section className={`${styles.table} ${tension >= 75 ? styles.closeGame : ""} ${complete && net > 0 ? styles.win : ""} ${complete && net < 0 ? styles.loss : ""}`} style={{ "--pressure": `${tension / 100}` }} aria-label={`${MODES[game].name} table`}>
                <div className={styles.tableHeader}><div><span className={styles.eyebrow}>{round ? round.stage.replaceAll("_", " ") : "YOUR SEAT IS READY"}</span><h2>{MODES[game].name}</h2></div><span className={styles.pot}>{game === "HOLDEM" ? "Pot" : "Your stake"}<strong>{format(round ? game === "HOLDEM" ? round.pot : round.stake : stake)} <small>coins</small></strong></span></div>
                {round ? <>
                    <div className={styles.opponents}>{round.opponents.map((seat, index) => <div className={`${styles.seat} ${seat.folded ? styles.folded : ""}`} key={seat.name}><div className={styles.avatar}>{seat.name[0]}</div><span className={styles.seatName}>{seat.name}{seat.folded ? " · folded" : ""}</span><Cards cards={seat.cards} prefix={`opponent-${round.id}-${index}`} /><small>{seat.total != null ? `Total ${seat.total}` : seat.hand || "Cards hidden"}</small></div>)}</div>
                    {game === "HOLDEM" && <div className={styles.community}><span>Community cards</span><Cards cards={[...round.board, ...Array(5 - round.board.length).fill(null)]} prefix={`board-${round.id}`} /></div>}
                    <div className={styles.player}><span className={styles.seatName}>You <span className={styles.handBadge}>{round.total != null ? `Total ${round.total}` : round.hand}</span></span><Cards cards={round.cards} prefix={`player-${round.id}`} /></div>
                    <p className={styles.message} role="status">{round.message}</p>
                    {!complete && <div className={styles.pressure}><span>{tension >= 75 ? "Down to the wire" : game === "HOLDEM" ? "The table is heating up" : "Make your move"}</span><div><i /></div><small>{game === "BLACKJACK" ? "Tension reflects your total, not your win chance." : "Tension rises toward showdown, not your win chance."}</small></div>}
                    {complete && <div className={styles.result} role="status"><span>{round.outcome === "WIN" ? "✦" : round.outcome === "LOSS" ? "↘" : "↔"}</span><strong>{net > 0 ? "+" : ""}{format(net)} coins</strong><small>{format(round.payout)} returned · {format(round.committed)} committed</small><Link to="/progression">Check your quest progress →</Link></div>}
                    {complete && net > 0 && <div className={styles.sparkles} aria-hidden="true">{Array.from({length: 12}, (_, index) => <i key={index} style={{ "--i": index }} />)}</div>}
                </> : <div className={styles.emptyTable}><div className={styles.fannedCards}><PlayingCard /><PlayingCard /><PlayingCard /></div><h3>A little nerve. A little luck.</h3><p>{game === "BLACKJACK" ? "Just you, the dealer, and a race to 21." : "Three seats. Five community cards. One pot."}</p><span>In-game coins only · every stake can be lost</span></div>}
            </section>
            <aside className={styles.controls}>
                {active ? <><h2>Your move</h2><p>{format(round?.committed)} coins committed to this hand.</p><div className={styles.actionStack}>{round?.actions.includes("HIT") && <><Button disabled={busy} onClick={() => transact(() => actOnHand(round, "HIT"))}>Hit · one more card</Button><Button variant="secondary" disabled={busy} onClick={() => transact(() => actOnHand(round, "STAND"))}>Stand · hold your total</Button></>}{round?.actions.includes("CHECK") && <><Button disabled={busy} onClick={() => transact(() => actOnHand(round, "CHECK"))}>{round.stage === "RIVER" ? "Check · showdown" : "Check · next card"}</Button><label className={styles.field}>Additional raise<input type="number" min="1" max={balance} step="1" value={raise} onChange={event => setRaise(event.target.value)} disabled={busy || balance === 0} /></label><Button variant="secondary" disabled={busy || !Number.isSafeInteger(Number(raise)) || Number(raise) < 1 || Number(raise) > balance} onClick={() => transact(() => actOnHand(round, "RAISE", Number(raise)))}>Raise {format(raise)} coins</Button><Button variant="danger" disabled={busy} onClick={() => transact(() => actOnHand(round, "FOLD"))}>Fold · leave the pot</Button></>}</div><small className={styles.note}>Your hand is saved. You can leave and return to finish it.</small></> : <><h2>{complete ? "Next hand?" : "Choose your stake"}</h2><p>Commit at least 10% of your current coins. Choose all-in to put them all on the table.</p><div className={styles.stake}><strong>{format(stake)}</strong><span>coins · {percent}% of your balance</span></div><label className={styles.range}>Stake percentage<input type="range" min="10" max="100" step="1" value={percent} onChange={event => setPercent(Number(event.target.value))} disabled={busy || !wallet} /></label><div className={styles.presets}>{[10,25,50,100].map(value => <button key={value} aria-pressed={percent === value} disabled={busy} onClick={() => setPercent(value)}>{value === 100 ? "All-in" : `${value}%`}</button>)}</div><Button disabled={busy || !data || !wallet || stake <= 0 || stake > 1_000_000_000_000} onClick={deal}>{busy ? "Dealing…" : "Commit coins & deal"}</Button>{balance === 0 && wallet && <small className={styles.note}>Open your daily coin crate or sell an inventory item to get back to the table.</small>}<p className={styles.note}>Stake is deducted when the hand starts. Returns include your original stake. No coin purchases or cash payouts.</p></>}
                <details className={styles.rules}><summary>How this table works</summary><p>{MODES[game].rules}</p></details>
            </aside>
        </div>
        <div className={styles.loop}><span>Daily crate</span><i>→</i><span>Play a hand</span><i>→</i><span>Complete quests</span><i>→</i><Link to="/crates">Build your vault ↗</Link></div>
    </div>;
}
