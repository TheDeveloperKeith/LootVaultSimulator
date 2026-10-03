import { blip } from "../sfx";
import styles from "./Button.module.css";

// variant: "primary" | "secondary" | "danger"    size: "sm" | "md" | "lg"
export default function Button({
                                   variant = "primary",
                                   size = "md",
                                   className = "",
                                   onClick,
                                   children,
                                   ...rest
                               }) {
    return (
        <button
            type="button"
            className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
            onClick={(e) => {
                blip(440, 0.1);
                onClick?.(e);
            }}
            {...rest}
        >
            {children}
        </button>
    );
}
