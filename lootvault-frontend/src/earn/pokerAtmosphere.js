export function riverMusicTier(round) {
    if (round?.game !== "HOLDEM") return 0;
    const hand = round.hand || round.showdown?.playerHand;
    if (["Four of a kind", "Straight flush"].includes(hand)) return 2;
    return ["Two pair", "Three of a kind", "Straight", "Flush", "Full house"].includes(hand) ? 1 : 0;
}

export function pokerAtmosphere(round) {
    if (!round || round.game !== "HOLDEM" || round.stage === "COMPLETE") return { level: 0, label: "" };
    // Potential hands and AI pressure alone never activate music or shaking.
    if (riverMusicTier(round) === 0) return { level: 1, label: "Eyes on the river" };
    if (["Flush", "Full house", "Four of a kind", "Straight flush"].includes(round.hand)) return { level: 4, label: `${round.hand} · the sky is breaking` };
    const suits = {};
    [...round.cards, ...round.board].forEach(card => { suits[card.suit] = (suits[card.suit] || 0) + 1; });
    if (round.board.length < 5 && round.cards.some(card => suits[card.suit] === 4)) return { level: 3, label: "Flush draw · one suited card away" };
    return { level: 2, label: `${round.hand} · tension rising` };
}
