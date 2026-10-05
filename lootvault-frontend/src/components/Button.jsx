import { isReducedMotion } from "../preferences/motion";
import { playGameEffect } from "../sfx";
import styles from "./Button.module.css";

// variant: "primary" | "secondary" | "danger"    size: "sm" | "md" | "lg"
export default function Button({
                                   variant = "primary",
                                   size = "md",
                                   className = "",
                                   onClick,
                                   soundPitch = 1,
                                   children,
                                   ...rest
                               }) {
    return (
        <button
            type="button"
            className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
            onClick={(e) => {
                playGameEffect(variant === "danger" ? "back" : variant === "primary" ? "confirm" : "click", .45, soundPitch);
                if (!isReducedMotion()) e.currentTarget.animate([{transform:"scale(.97)"},{transform:"scale(1)"}], {duration:220,easing:"cubic-bezier(.2,.8,.2,1)"});
                onClick?.(e);
            }}
            {...rest}
        >
            {children}
        </button>
    );
}
