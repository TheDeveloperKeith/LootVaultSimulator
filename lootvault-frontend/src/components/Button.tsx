import type { ButtonHTMLAttributes } from "react";
import type { MotionProps } from "framer-motion";
import { motion } from "framer-motion";
import { useReducedMotion, isReducedMotion } from "../preferences/motion";
import { playGameEffect } from "../sfx";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> & {
    animated?: boolean; variant?: ButtonVariant; size?: ButtonSize; soundPitch?: number;
};
const AnimatedButton = motion.button;

// variant: "primary" | "secondary" | "danger"    size: "sm" | "md" | "lg"
export default function Button({
                                   animated = false,
                                   variant = "primary",
                                   size = "md",
                                   className = "",
                                   onClick,
                                   soundPitch = 1,
                                   children,
                                   ...rest
                               }: ButtonProps) {
    const reduced = useReducedMotion();
    const Component = animated ? AnimatedButton : "button";
    const feedback: Pick<MotionProps, "whileHover" | "whileTap" | "transition"> = animated ? { whileHover: !reduced && !rest.disabled ? { scale: 1.035, y: -2 } : undefined, whileTap: !reduced && !rest.disabled ? { scale: .96, y: 0 } : undefined, transition: { type: "spring", stiffness: 420, damping: 24 } } : {};
    return (
        <Component
            {...feedback}
            data-variant={variant}
            type="button"
            className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
            onClick={(e) => {
                playGameEffect(variant === "danger" ? "back" : variant === "primary" ? "confirm" : "click", .45, soundPitch);
                if (!animated && !isReducedMotion()) e.currentTarget.animate([{transform:"scale(.97)"},{transform:"scale(1)"}], {duration:220,easing:"cubic-bezier(.2,.8,.2,1)"});
                onClick?.(e);
            }}
            {...rest}
        >
            {children}
        </Component>
    );
}
