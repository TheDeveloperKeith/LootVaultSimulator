import styles from "./PrimitiveButtonGroup.module.css";

// BJORK UI primitive-button-group, adapted from its registry to CSS modules.
// Source: https://ui.isaiahbjork.com/primitive-button-group.json
export default function PrimitiveButtonGroup({ className = "", ...props }) {
    return <div role="group" className={`${styles.group} ${className}`} {...props} />;
}
