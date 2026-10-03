export function pokerAtmosphere(round) {
    if (!round || round.game !== "HOLDEM" || round.stage === "COMPLETE") return { level: 0, label: "" };
    const cards = [...round.cards, ...round.board];
    const suits = {};
    cards.forEach(card => { suits[card.suit] = (suits[card.suit] || 0) + 1; });
    if (["Flush", "Full house", "Four of a kind", "Straight flush"].includes(round.hand)) return { level: 3, label: `${round.hand} · showdown is calling` };
    if (round.board.length < 5 && round.cards.some(card => suits[card.suit] === 4)) return { level: 2, label: "Flush draw · one suited card away" };
    const ranks = {};
    cards.forEach(card => { ranks[card.rank] = (ranks[card.rank] || 0) + 1; });
    if (round.board.length < 5 && (Object.values(ranks).includes(3) || Object.values(ranks).filter(count => count === 2).length >= 2))
        return { level: 2, label: "Full house potential · watch the next card" };
    if (round.cards.length === 2 && round.cards[0].rank === round.cards[1].rank && round.cards[0].rank >= 12)
        return { level: 2, label: `Pocket ${{14:"aces",13:"kings",12:"queens"}[round.cards[0].rank]} · premium start` };
    return { level: 1, label: "Eyes on the river" };
}
