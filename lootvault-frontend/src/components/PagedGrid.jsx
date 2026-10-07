import { useEffect, useRef, useState } from "react";
import styles from "./ScreenLayout.module.css";

export default function PagedGrid({ items, renderItem, label = "Items", minWidth = 210, minHeight = 230, maxColumns = 4, className = "" }) {
    const stage = useRef(null);
    const [layout, setLayout] = useState({ columns: 1, rows: 1 });
    const [page, setPage] = useState(0);
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            const columns = Math.max(1, Math.min(maxColumns, Math.floor((width + 12) / (minWidth + 12))));
            const rows = Math.max(1, Math.min(3, Math.floor((height + 12) / (minHeight + 12))));
            setLayout(previous => previous.columns === columns && previous.rows === rows ? previous : { columns, rows });
        });
        observer.observe(stage.current);
        return () => observer.disconnect();
    }, [minWidth, minHeight, maxColumns]);
    const capacity = layout.columns * layout.rows;
    const pages = Math.max(1, Math.ceil(items.length / capacity));
    const current = Math.min(page, pages - 1);
    const start = current * capacity;
    return <div className={styles.paged}>
        <div ref={stage} className={styles.stage}>
            <ul className={`${styles.grid} ${className}`} aria-label={label} style={{ gridTemplateColumns: `repeat(${layout.columns},minmax(0,1fr))`, gridTemplateRows: `repeat(${layout.rows},minmax(0,1fr))` }}>
                {items.slice(start, start + capacity).map(renderItem)}
            </ul>
            {!items.length && <p className={styles.empty}>Nothing here yet.</p>}
        </div>
        <nav className={styles.pagination} aria-label={`${label} pages`}>
            <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
            <span role="status" aria-live="polite">{items.length ? `${start + 1}–${Math.min(start + capacity,items.length)} of ${items.length}` : "0 items"} · Page {current + 1}/{pages}</span>
            <button type="button" disabled={current === pages - 1} onClick={() => setPage(current + 1)}>Next</button>
        </nav>
    </div>;
}
