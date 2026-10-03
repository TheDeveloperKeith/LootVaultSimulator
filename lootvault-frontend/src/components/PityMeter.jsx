import styles from "../pages/ProgressionPage.module.css";

export default function PityMeter({ counter }) {
    const remaining = Math.max(0, counter.guaranteeAt - counter.current);
    return <div className={styles.pity}>
        <div className={styles.row}><strong>Extraordinary guarantee</strong><span>{counter.current} / {counter.guaranteeAt}</span></div>
        <progress className={styles.meter} value={counter.current} max={counter.guaranteeAt} aria-label="Pity progress" />
        <small>{remaining <= 1 ? "Guaranteed on your next pull" : `Guaranteed within ${remaining} pulls`}</small>
    </div>;
}
