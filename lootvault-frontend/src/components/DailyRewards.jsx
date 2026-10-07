import GemIcon from "./GemIcon";
import {getGems,claimDailyGems} from "../api/gems";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api/client";
import { getTodayGrant, openLootBox } from "../api/game";
import { getEarnState, claimDailyCoins } from "../api/earn";
import { useWallet } from "../wallet/WalletContext";
import ScreenDialog from "./ScreenDialog";
import CrateIcon from "./CrateIcon";
import { RARITY_LABEL } from "../rarities";
import styles from "./DailyRewards.module.css";

export default function DailyRewards() {
 const location=useLocation(); const {refresh}=useWallet();
 const [rewards,setRewards]=useState(null); const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [message,setMessage]=useState("");
 const prompted=useRef(false);
 useEffect(()=>{
  let alive=true;
  const load=async()=>{try {const [grant,state,tour,gems]=await Promise.all([getTodayGrant(),getEarnState(),api.get("/api/onboarding"),getGems()]);if(alive){setRewards({grant,daily:state.daily,gems});if(tour.completed&&!prompted.current&&(grant.boxesRemaining>0||!state.daily.claimed||!gems.claimed)){prompted.current=true;setOpen(true);}}}catch(err){if(alive)setError(err.message||"Could not load daily rewards.");}};
  const reopen=()=>{setOpen(true);setError("");void load();};
  if(location.pathname==="/menu") void load();
  window.addEventListener("lootvault:show-daily",reopen);window.addEventListener("lootvault:onboarding-complete",load);
  return()=>{alive=false;window.removeEventListener("lootvault:show-daily",reopen);window.removeEventListener("lootvault:onboarding-complete",load);};
 },[location.pathname]);
 async function accept(kind){if(busy)return;setBusy(true);setError("");try {
  if(kind==="coins"){const result=await claimDailyCoins();setRewards(prev=>({...prev,daily:result.daily}));setMessage("Daily coins added to your wallet.");await refresh();}
  else if(kind==="gems"){const gems=await claimDailyGems();setRewards(prev=>({...prev,gems}));setMessage("5 gems added to your wallet.");await refresh();}
  else {const item=await openLootBox();setMessage(`${item.itemName} · ${RARITY_LABEL[item.rarity]} added to your inventory.`);const grant=await getTodayGrant();setRewards(prev=>({...prev,grant}));}
  window.dispatchEvent(new Event("lootvault:daily-changed"));
 }catch(err){setError(err.message);}finally{setBusy(false);}}
 if(!open||location.pathname!=="/menu")return null;
 return <ScreenDialog title="Daily rewards" onClose={()=>{prompted.current=true;setOpen(false);}}><div className={styles.panel}>
 <p className={styles.intro}>A little boost for your next adventure.</p>
 {!rewards&&<p role="status">Loading rewards… Close and reopen to retry.</p>}
 {rewards&&<>
 <article className={styles.row}><div className={styles.icon}><svg viewBox="0 0 60 60" width="48" height="48" aria-hidden="true"><circle cx="30" cy="27" r="20" fill="#ffcf47" stroke="#fff0a2" strokeWidth="3"/><path d="m30 12 4 10 11 1-9 7 3 11-9-6-9 6 3-11-9-7 11-1z" fill="#fff6c2"/></svg><b>{rewards.daily.coins.toLocaleString()}</b></div><div className={styles.label}><h3>Coins</h3><p>Daily reward</p></div><button disabled={busy||rewards.daily.claimed} onClick={()=>accept("coins")}>{rewards.daily.claimed?"Claimed":"Accept"}</button></article>
 <article className={styles.row}><div className={styles.icon}><CrateIcon code="EXCELLENT" size={48}/><b>{rewards.grant.boxesRemaining}×</b></div><div className={styles.label}><h3>Daily crates</h3><p>One mystery item per crate</p></div><button disabled={busy||rewards.grant.boxesRemaining===0} onClick={()=>accept("crate")}>{rewards.grant.boxesRemaining===0?"Claimed":"Accept"}</button></article>
 <article className={styles.row}><div className={styles.icon}><GemIcon size={48}/><b>5×</b></div><div className={styles.label}><h3>Gems</h3><p>Daily luck-potion currency</p></div><button disabled={busy||rewards.gems.claimed} onClick={()=>accept("gems")}>{rewards.gems.claimed?"Claimed":"Accept"}</button></article>
 <small className={styles.note}>Accept opens one daily crate. Rewards reset daily.</small>
 </>}
 {busy&&<p role="status">Collecting your reward…</p>}{message&&<p role="status">{message}</p>}{error&&<p role="alert" className={styles.error}>{error}</p>}
 </div></ScreenDialog>;
}
