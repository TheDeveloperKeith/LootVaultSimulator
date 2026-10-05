import {readFileSync,writeFileSync} from "node:fs";
import {WEAPON_DESIGNS} from "../lootvault-frontend/src/items/designs.js";
const service=name=>readFileSync(`src/main/java/com/example/lootvaultproject/VaultService/${name}.java`,"utf8");
const signup=Number(service("AuthService").match(/SIGNUP_BONUS_SOFT = (\d+)L/)[1]);
const daily=Number(service("EarnLootService").match(/daily-coins:(\d+)/)[1]);
const query=readFileSync("src/main/java/com/example/lootvaultproject/VaultRepository/ShopOfferRepository.java","utf8");
const prices=Object.fromEntries([...query.matchAll(/WHEN '([^']+)' THEN (\d+)/g)].map(match=>[match[1],Number(match[2])]));prices.EXTRA_EXTRAORDINARY=Number(query.match(/ELSE (\d+) END/)[1]);
const rewardText=service("CollectionService").split("REWARDS = Map.of(")[1].split(");")[0];
const rewards=Object.fromEntries([...rewardText.matchAll(/"([^"\n]+)", (\d+)L/g)].map(match=>[match[1],Number(match[2])]));
const quests=Object.fromEntries([...service("QuestService").matchAll(/new Definition\(\s*"([^"]+)"[\s\S]*?Event\.[A-Z_]+,\s*(\d+),\s*(\d+)L\)/g)].map(match=>[match[1],Number(match[3])]));
const freeDaily=daily+quests.DAILY_COIN_CRATE+quests.DAILY_OPEN_3;
const rows=Object.entries(prices).map(([rarity,price])=>{const count=WEAPON_DESIGNS.filter(item=>item.rarity===rarity).length;return `| ${rarity} | ${price.toLocaleString()} | ${Math.ceil(Math.max(0,price-signup)/daily)} | ${Math.ceil(Math.max(0,price-signup)/freeDaily)} | ${count*price} | ${rewards[rarity]} |`;});
const report=`# Economy baseline

Generated from the current source configuration. Signup: ${signup} coins. Daily crate: ${daily}. Daily crate quest: ${quests.DAILY_COIN_CRATE}. Three free boxes quest: ${quests.DAILY_OPEN_3}.

| Rarity | Shop coins | Days using daily coins only | Days with all free daily rewards | Buy entire tier | One time tier reward |
|---|---:|---:|---:|---:|---:|
${rows.join("\n")}

Assumptions: starting signup balance, no spending, no wagering, no sales, no weekly or tier bonuses. The all-free path claims daily coins and their quest, opens three free boxes, and claims that quest each day (${freeDaily} coins/day). Days are collection days, not measured player retention. Card-game returns are random and are not budgeted as guaranteed income. Prices and bonuses need real playtest feedback before further tuning.
`;
writeFileSync("docs/economy-baseline.md",report);console.log(report);
