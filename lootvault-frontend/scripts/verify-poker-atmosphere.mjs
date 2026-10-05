import assert from 'node:assert/strict';
import { pokerAtmosphere, riverMusicTier } from '../src/earn/pokerAtmosphere.js';
const card = (rank, suit = 'SPADES') => ({ rank, suit });
const base = { game:'HOLDEM',stage:'FLOP',cards:[card(14),card(14,'HEARTS')],board:[card(2),card(7,'CLUBS'),card(9,'DIAMONDS')] };
let checks=0;
for (const hand of ['High card','One pair']) {
    for (const stage of ['FLOP','TURN','RIVER']) {
        assert.equal(pokerAtmosphere({...base,hand,stage,toCall:100}).level,1);checks++;
    }
    assert.equal(riverMusicTier({...base,hand}),0);checks++;
}
for (const hand of ['Two pair','Three of a kind','Straight','Flush','Full house']) {
    assert.equal(riverMusicTier({...base,hand}),1);checks++;
    assert.equal(pokerAtmosphere({...base,hand}).level,['Flush','Full house'].includes(hand)?4:2);checks++;
}
for (const hand of ['Four of a kind','Straight flush']) {
    assert.equal(riverMusicTier({...base,hand}),2);checks++;
    assert.equal(pokerAtmosphere({...base,hand}).level,4);checks++;
}
const draw={...base,cards:[card(14),card(10)],board:[card(2),card(7),card(9,'DIAMONDS')]};
assert.equal(pokerAtmosphere({...draw,hand:'High card'}).level,1);checks++;
assert.equal(pokerAtmosphere({...draw,hand:'Two pair'}).level,3);checks++;
assert.equal(pokerAtmosphere({...base,hand:'Full house',stage:'COMPLETE'}).level,0);checks++;
assert.equal(pokerAtmosphere({...base,hand:'Full house',game:'BLACKJACK'}).level,0);checks++;
console.log(`${checks} River atmosphere/music checks passed.`);
