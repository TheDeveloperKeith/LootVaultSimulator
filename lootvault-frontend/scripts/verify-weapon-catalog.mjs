import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WEAPON_DESIGNS, resolveItemDesign } from '../src/items/designs.js';
const sql = readFileSync(new URL('../../src/main/resources/db/migration/V7__weapon_designs.sql', import.meta.url), 'utf8');
const names = WEAPON_DESIGNS.map(item => item.name);
assert.equal(new Set(names).size, 18);
for (const item of WEAPON_DESIGNS) {
  assert.ok(sql.includes(`('${item.name}','${item.rarity}'`), `Missing migration entry: ${item.name}`);
  assert.equal(resolveItemDesign(item.name).type, item.type);
}
// NUMERIC(6,5) uses integer units of 1/100000. Verify budgets after pool expansion.
for (const [rarity, oldCount, budget] of [['COMMON',4,45000],['BASIC',3,28000],['EXCELLENT',3,15000],['EXOTIC',2,8000],['EXTRAORDINARY',2,4000]]) {
  const n = oldCount + WEAPON_DESIGNS.filter(item => item.rarity === rarity).length;
  const base = Math.floor(budget / n), remainder = budget - base * n;
  assert.ok(base > 0);
  assert.equal((base + remainder) + base * (n - 1), budget);
}
for (const item of WEAPON_DESIGNS.filter(item => item.rarity === 'EXTRA_EXTRAORDINARY'))
  assert.ok(sql.includes(`('${item.name}','${item.rarity}',0.00001,false,`), 'Mystery equipment must stay crate-exclusive');
console.log('18 designs match the migration; rarity budgets and crate-exclusive mystery items verified.');
