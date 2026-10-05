const ranks = ["High card","Pair","Two pair","Three of a kind","Straight","Flush","Full house","Four of a kind","Straight flush"];
function flushDraw(round) { const cards=[...(round?.cards || []),...(round?.board || [])];return round?.board?.length < 5 && round.cards?.some(card=>cards.filter(other=>other.suit===card.suit).length===4); }
export function pokerButtonPitch(previous,next) {
 if (!previous || !next || previous.id !== next.id || next.game !== "HOLDEM") return 1;
 const before=ranks.indexOf(previous.hand),after=ranks.indexOf(next.hand);
 if(after>before) return 1.25;
 if(after<before || (flushDraw(previous) && !flushDraw(next) && after<=before)) return .8;
 return 1;
}
