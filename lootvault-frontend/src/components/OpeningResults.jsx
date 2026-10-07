import { useEffect,useRef,useState } from "react";
import ItemIcon from "./ItemIcon";
import RarityBurst from "./RarityBurst";
import { RARITY_LABEL,BURST_RARITIES } from "../rarities";
import styles from "./OpeningResults.module.css";
export default function OpeningResults({items,onClose}) {
 const close=useRef(null);useEffect(()=>{const previous=document.activeElement;close.current?.focus();return()=>{if(previous?.isConnected)previous.focus();};},[]);
 const [scene,setScene]=useState(null);
 return <><div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${items.length} rewards secured`} onKeyDown={event=>{if(event.defaultPrevented)return;if(event.key==="Escape"){event.preventDefault();onClose();}if(event.key==="Tab"){const controls=[...event.currentTarget.querySelectorAll("button,a,input,select")].filter(node=>!node.disabled);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}}}><section className={styles.panel}><header><h2>{items.length} rewards secured</h2><button ref={close} onClick={onClose}>Close</button></header><p>Every item is already in your inventory. Select a rare reward to replay its reveal.</p><ul className={styles.grid}>{items.map(item=><li key={item.id}><ItemIcon name={item.itemName} size={75}/><strong>{item.itemName}</strong><small>{RARITY_LABEL[item.rarity]}</small>{BURST_RARITIES.has(item.rarity)&&<button onClick={()=>setScene({...item,key:crypto.randomUUID()})}>Watch reveal ↗</button>}</li>)}</ul></section></div>{scene&&<RarityBurst key={scene.key} rarity={scene.rarity} itemName={scene.itemName}/>}</>;
}
