// Creates only a disposable smoke account. Use against a local test backend.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {mkdirSync,writeFileSync} from "node:fs";
const base=process.env.MVP_TEST_BASE || "http://127.0.0.1:8082";
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))throw new Error("Smoke verification is restricted to a local backend.");
const cookies=new Map();let csrfPromise;
async function raw(path,body,headers={}) {
 const response=await fetch(base+path,{method:body===undefined?"GET":"POST",headers:{"Content-Type":"application/json",Cookie:[...cookies].map(([k,v])=>k+"="+v).join("; "),...headers},body:body===undefined?undefined:JSON.stringify(body)});
 for(const entry of response.headers.getSetCookie()){const pair=entry.split(";")[0],index=pair.indexOf("=");cookies.set(pair.slice(0,index),pair.slice(index+1));}
 const text=await response.text();let data;try{data=text?JSON.parse(text):null;}catch{data=text;}
 return {status:response.status,data};
}
async function request(path,body) {
 const token=body===undefined?null:await (csrfPromise ||= raw("/api/auth/csrf").then(result=>{assert.equal(result.status,200);return result.data;}));
 const result=await raw(path,body,token?{[token.headerName]:token.token}:{});
 if(path.startsWith("/api/auth/") && body!==undefined && result.status<300)csrfPromise=undefined;
 return result;
}
const suffix=randomUUID().replaceAll("-","");const username="mvp_smoke_"+suffix;const password=randomUUID()+randomUUID();
assert.equal((await request("/api/auth/me")).status,204);
assert.equal((await request("/api/auth/register",{username,email:username+"@testing.invalid",password})).status,201);
assert.equal((await request("/api/auth/login",{username,password})).status,200);
const player=(await request("/api/auth/me")).data;
mkdirSync("tmp",{recursive:true});writeFileSync("tmp/mvp-smoke-account.json",JSON.stringify({id:player.id,username}));
assert.equal((await request("/api/wallets/me")).data.softBalance,500);
assert.equal((await request(`/api/wallets/${player.id}/credit`,{currency:"SOFT",amount:10000})).status,403);
assert.equal((await raw("/api/earn/daily/claim",{})).status,403);
const claims=await Promise.all([request("/api/earn/daily/claim",{}),request("/api/earn/daily/claim",{})]);assert(claims.every(result=>result.status===200));
const daily=claims[0].data.daily.coins;assert.equal((await request("/api/wallets/me")).data.softBalance,500+daily);
const quests=(await request("/api/progression/quests")).data;const dailyQuest=quests.find(q=>q.code==="DAILY_COIN_CRATE" || q.questCode==="DAILY_COIN_CRATE");assert(dailyQuest?.completed,"Daily claim should complete its quest");
const rewards=await Promise.all([request(`/api/progression/quests/${dailyQuest.id}/claim`,{}),request(`/api/progression/quests/${dailyQuest.id}/claim`,{})]);assert.equal(rewards.filter(result=>result.status===200).length,1);
assert.equal((await request("/api/wallets/me")).data.softBalance,500+daily+100);
const bought=(await request("/api/crates/COMMON/buy",{}));assert.equal(bought.status,200);
const opened=await Promise.all([request(`/api/crates/${bought.data.id}/open`,{}),request(`/api/crates/${bought.data.id}/open`,{})]);assert.equal(opened.filter(result=>result.status===200).length,1);
assert.equal((await request("/api/inventory")).data.length,1);
assert.equal((await request("/api/progression/collection")).data.collected,1);
const offers=(await request("/api/shop/offers")).data;
const affordable=offers.find(offer=>offer.rarity==="COMMON");assert(affordable);
const beforePurchase=(await request("/api/wallets/me")).data.softBalance;
const purchased=await request(`/api/shop/offers/${affordable.id}/buy`,{});assert.equal(purchased.status,200);
assert.equal((await request("/api/wallets/me")).data.softBalance,beforePurchase-affordable.priceAmount);
assert((await request("/api/inventory")).data.some(item=>item.id===purchased.data.id));
const unaffordable=offers.find(offer=>offer.priceAmount>beforePurchase);assert(unaffordable);
assert.equal((await request(`/api/shop/offers/${unaffordable.id}/buy`,{})).status,409);
assert.equal((await request("/api/wallets/me")).data.softBalance,beforePurchase-affordable.priceAmount);
const requestId=randomUUID();const start={game:"HOLDEM",stake:110,requestId};
const started=await request("/api/earn/rounds",start);assert.equal(started.status,200);const balanceAfter=(await request("/api/wallets/me")).data.softBalance;
assert.equal((await request("/api/earn/rounds",start)).status,200);assert.equal((await request("/api/wallets/me")).data.softBalance,balanceAfter);
assert.equal((await request("/api/earn")).data.round.id,requestId);
const recovered=(await request("/api/earn")).data.round;
const actionResults=await Promise.all([request(`/api/earn/rounds/${requestId}/actions`,{version:recovered.version,action:"CHECK",raiseAmount:0}),request(`/api/earn/rounds/${requestId}/actions`,{version:recovered.version,action:"CHECK",raiseAmount:0})]);assert.equal(actionResults.filter(result=>result.status===200).length,1);
let round=(await request("/api/earn")).data.round;
if(round.stage!=="COMPLETE"){assert.equal((await request(`/api/earn/rounds/${requestId}/actions`,{version:round.version,action:"FOLD",raiseAmount:0})).status,200);}
const blackjackId=randomUUID();const currentBalance=(await request("/api/wallets/me")).data.softBalance;
const blackjack=await request("/api/earn/rounds",{game:"BLACKJACK",stake:Math.ceil(currentBalance*.1),requestId:blackjackId});assert.equal(blackjack.status,200);
let blackjackRound=(await request("/api/earn")).data.round;assert.equal(blackjackRound.id,blackjackId);
if(blackjackRound.stage!=="COMPLETE")assert.equal((await request(`/api/earn/rounds/${blackjackId}/actions`,{version:blackjackRound.version,action:"STAND",raiseAmount:0})).status,200);
blackjackRound=(await request("/api/earn")).data.round;assert.equal(blackjackRound.stage,"COMPLETE");
const settledBalance=(await request("/api/wallets/me")).data.softBalance;
await request(`/api/earn/rounds/${blackjackId}/actions`,{version:blackjackRound.version,action:"STAND",raiseAmount:0});
assert.equal((await request("/api/wallets/me")).data.softBalance,settledBalance);
const odds=(await request("/api/lootboxes/odds")).data;assert(Math.abs(Object.values(odds).reduce((sum,value)=>sum+value,0)-100)<.001);
const freeOpenings=await Promise.all(Array.from({length:4},()=>request("/api/lootboxes/open",{})));
assert.equal(freeOpenings.filter(result=>result.status===200).length,3);
assert.equal((await request("/api/lootboxes")).data.boxesRemaining,0);
assert.equal((await request("/api/inventory")).data.length,5);
assert.equal((await request("/api/onboarding")).data.completed,false);
assert.equal((await request("/api/onboarding/complete",{})).status,200);assert.equal((await request("/api/onboarding/complete",{})).status,200);assert.equal((await request("/api/onboarding")).data.completed,true);
assert.equal((await request("/api/auth/logout",{})).status,204);assert.equal((await request("/api/auth/me")).status,204);assert.equal((await request("/api/earn")).status,401);
console.log("Live MVP smoke passed: sessions, CSRF, blocked top-ups, duplicate daily/quest claims, crate race, shop balances and rejected purchases, collection recording, idempotent deal, saved poker/blackjack hands, one-time settlement, three free openings under race, real odds, tutorial persistence, logout.");
console.log("Disposable account ID recorded in ignored tmp/mvp-smoke-account.json for exact cleanup.");
