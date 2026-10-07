import { useReducedMotion } from "../preferences/motion";
import styles from "./RelicMoveEffect.module.css";
export default function RelicMoveEffect({effect}) {
 const reduced=useReducedMotion();
 if(!effect || reduced)return null;
 return <div key={effect.key} className={`${styles.stage} ${styles[effect.variant] || ""}`} aria-hidden="true" style={{"--relic-color":effect.color}}>{effect.type === "shield" ? <div className={styles.guard}><svg viewBox="0 0 100 120"><path d="M50 5 90 22 84 76Q70 104 50 115Q30 104 16 76L10 22Z"/><path d="M50 20V95M25 48H75"/></svg></div> : <><i className={styles.slash}/><i className={styles.echo}/></>}</div>;
}
