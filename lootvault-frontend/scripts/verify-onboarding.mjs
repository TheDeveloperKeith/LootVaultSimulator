import assert from "node:assert/strict";
import {DEMO_ROUNDS,DEMO_RESULT} from "../src/onboarding/demoRounds.js";
import {pokerAtmosphere,riverMusicTier} from "../src/earn/pokerAtmosphere.js";
assert.deepEqual(DEMO_ROUNDS.map(round=>pokerAtmosphere(round).level),[1,2,3,4,4]);
assert.deepEqual(DEMO_ROUNDS.map(riverMusicTier),[0,1,1,1,2]);
for(const round of DEMO_ROUNDS){const cards=[...round.cards,...round.board];assert.equal(new Set(cards.map(card=>card.rank+card.suit)).size,cards.length);assert.equal(round.committed,0);assert.equal(round.pot,0);}
assert.equal(DEMO_RESULT.stage,"COMPLETE");assert.equal(DEMO_RESULT.showdown.extreme,true);assert.equal(DEMO_RESULT.payout,0);
console.log("Tutorial snapshots verified: every intensity and music tier, unique cards, no coins at stake.");
