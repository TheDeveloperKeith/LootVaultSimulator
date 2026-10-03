import { Link } from "react-router-dom";
import styles from "./PlaceholderPage.module.css";

export default function PlaceholderPage({ title }) {
  return (
    <div className={styles.page}>
      <section className={styles.panel}>
      <span className={styles.badge}>Coming soon</span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.sub}>A new way to build your vault is on the way.</p>
      <Link to="/menu">Return to lobby →</Link>
      </section>
    </div>
  );
}
