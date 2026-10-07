import { useEffect, useId, useRef } from "react";
import styles from "./ScreenLayout.module.css";

export default function ScreenDialog({ title, onClose, children }) {
    const dialog = useRef(null);
    const heading = useId();
    useEffect(() => { if (!dialog.current.open) dialog.current.showModal(); }, []);
    return <dialog ref={dialog} className={styles.dialog} aria-labelledby={heading} onClose={onClose}>
        <header className={styles.dialogHead}><h2 id={heading}>{title}</h2><button type="button" autoFocus onClick={() => dialog.current.close()}>Close</button></header>
        {children}
    </dialog>;
}
