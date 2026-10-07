import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { getCrateTypes } from "../api/crates";
import CrateIcon from "../components/CrateIcon";
import ItemIcon from "../components/ItemIcon";
import PagedGrid from "../components/PagedGrid";
import { RARITY_LABEL } from "../rarities";
import styles from "./ContainerPage.module.css";
export default function ContainerPage() {
 const {code}=useParams(); const [data,setData]=useState(null); const [error,setError]=useState("");
 useEffect(()=>{let alive=true; Promise.all([getCrateTypes(),api.get(`/api/crates/${encodeURIComponent(code)}/contents`)]).then(([types,items])=>{if(alive)setData({crate:types.find(type=>type.code===code),items});}).catch(error=>{if(alive)setError(error.message);});return()=>{alive=false;};},[code]);
 return <section className={styles.page}><Link to="/crates">← Crate exchange</Link><header data-page-header="true"><CrateIcon code={code} size={100}/><div><small>CONTAINER INSPECTION</small><h1>{data?.crate?.displayName || "Container contents"}</h1><p>One item per opening. These are the actual server reward pool and item probabilities.</p></div></header>{error ? <p role="alert">{error}</p> : !data ? <p role="status">Inspecting contents…</p> : <PagedGrid items={data.items} label="Possible rewards" minHeight={150} maxColumns={6} className={styles.grid} renderItem={item=><li key={item.name}><ItemIcon name={item.name} size={70}/><strong>{item.name}</strong><span>{RARITY_LABEL[item.rarity]} · {item.chance.toFixed(3)}%</span></li>}/>}</section>;
}
