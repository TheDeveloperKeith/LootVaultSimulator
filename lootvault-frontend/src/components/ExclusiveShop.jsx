import {buyLuckPotion} from "../api/gems";
import GemIcon from "./GemIcon";
import { useEffect, useState } from "react";
import ScreenDialog from "./ScreenDialog";
import ItemIcon from "./ItemIcon";
import { getShopOffers,buyShopOffer } from "../api/shop";
import { resolveItemDesign } from "../items/designs";
import { useWallet } from "../wallet/WalletContext";
import styles from "./ExclusiveShop.module.css";
function LuckIcon({ultra}){return <svg viewBox="0 0 70 85" width="65" height="78" aria-hidden="true"><path d="M27 8h16v9H27z" fill={ultra?"#ffd778":"#a3f4d0"} stroke="#fff" strokeWidth="2"/><path d="M29 17v18L14 59q-7 18 21 19 28-1 21-19L41 35V17z" fill={ultra?"#b18835":"#258168"} stroke={ultra?"#ffe8a6":"#baffeb"} strokeWidth="3"/><path d="M22 53h26l5 12q0 8-18 8t-18-8z" fill={ultra?"#fff1a6":"#89ffe5"}/><path d="m35 40 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="white"/></svg>}
export default function ExclusiveShop({onClose}){
 const {wallet,gems,refresh}=useWallet();const [potionRequest,setPotionRequest]=useState(null);const [offers,setOffers]=useState(null);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");const [selected,setSelected]=useState(null);
 useEffect(()=>{let alive=true;getShopOffers().then(data=>{if(alive)setOffers(data.filter(item=>item.rarity==="EXTRA_EXTRAORDINARY"&&resolveItemDesign(item.itemName).type==="sword"));}).catch(err=>{if(alive)setError(err.message)});return()=>{alive=false}},[]);
 async function buy(){if(busy)return;setBusy(true);setError("");try{await buyShopOffer(selected.id);await refresh();setNotice(`${selected.itemName} added to your vault.`);setSelected(null)}catch(err){setError(err.message)}finally{setBusy(false)}}
 async function potion(kind){if(busy)return;const request=potionRequest || {requestId:crypto.randomUUID(),kind};setPotionRequest(request);setBusy(true);setError("");try{await buyLuckPotion(request.requestId,request.kind);setPotionRequest(null);await refresh();setNotice("Potion activated for your next 10 banner rolls.");}catch(err){if(err.status>=400&&err.status<500)setPotionRequest(null);setError(err.message+ (!(err.status>=400&&err.status<500)?" Retry this potion to recover the purchase.":""));}finally{setBusy(false)}}
 return <ScreenDialog title="Exclusive Shop" onClose={onClose}><section className={styles.shop}><header className={styles.heading}>EXCLUSIVE FINDS <span><GemIcon size={20}/>{wallet?.unlimited?"∞":gems?.gems??"—"} gems · weapons use coins</span></header>{gems?.rollsRemaining>0&&<p role="status">{gems.multiplier}× featured odds · {gems.rollsRemaining} rolls left. Potions don’t stack; secret odds stay unchanged.</p>}<div className={styles.grid}>
 {[false,true].map(ultra=><article className={`${styles.product} ${ultra?styles.ultra:styles.lucky}`} key={String(ultra)}><LuckIcon ultra={ultra}/><h3>{ultra?"Ultra Lucky":"Lucky"} potion</h3><p>{ultra?"5.5×":"2.5×"} featured odds · next 10 banner rolls</p><p><GemIcon size={22}/>{ultra?25:10} gems</p><button disabled={busy||!gems||(potionRequest ? potionRequest.kind!==(ultra?"ULTRA_LUCKY":"LUCKY") : gems.rollsRemaining>0||(!wallet?.unlimited&&gems.gems<(ultra?25:10)))} onClick={()=>potion(ultra?"ULTRA_LUCKY":"LUCKY")}>{potionRequest?.kind===(ultra?"ULTRA_LUCKY":"LUCKY")?"Retry purchase":gems?.rollsRemaining>0?"Potion active":"Buy & activate"}</button></article>)}
 {offers?.map(offer=><article key={offer.id} className={`${styles.product} ${styles.weapon}`}><span className={styles.rarity}>????</span><ItemIcon name={offer.itemName} size={85}/><h3>{offer.itemName}</h3><p>{offer.priceAmount.toLocaleString()} coins</p><button disabled={busy} onClick={()=>setSelected(offer)}>Inspect weapon</button></article>)}
 </div>{!offers&&!error&&<p role="status">Loading exclusive weapons…</p>}{offers?.length===0&&<p>No ???? weapons in the current shop rotation.</p>}
 {selected&&<div className={styles.confirm}><strong>{selected.itemName}</strong><p>{selected.priceAmount.toLocaleString()} coins · added directly to your inventory</p><button disabled={busy||!wallet||(!wallet.unlimited&&wallet.softBalance<selected.priceAmount)} onClick={buy}>{busy?"Buying…":"Buy weapon"}</button><button disabled={busy} onClick={()=>setSelected(null)}>Back</button></div>}
 {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
 </section></ScreenDialog>
}
