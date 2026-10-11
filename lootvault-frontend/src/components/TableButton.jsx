import { Button as AriaButton } from "react-aria-components";
import { motion } from "framer-motion";
import { useReducedMotion } from "../preferences/motion";
import { playGameEffect } from "../sfx";

export default function TableButton({ pending = false, size = "md", disabled, onClick, children, className = "", variant = "primary", soundPitch = 1, ...props }) {
    const reduced = useReducedMotion();
    return <AriaButton {...props} type="button" isDisabled={disabled && !pending} isPending={pending} aria-busy={pending || undefined} className={className} data-variant={variant} data-size={size} onPress={event => {
        playGameEffect(variant === "danger" ? "back" : variant === "primary" ? "confirm" : "click", .45, soundPitch);
        onClick?.(event);
    }}>{({ isPressed, isHovered }) => <><span data-texture-surface aria-hidden="true" /><motion.span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: ".35rem" }} animate={{ scale: reduced ? 1 : isPressed ? .96 : isHovered ? 1.025 : 1 }} transition={{ type: "spring", stiffness: 420, damping: 26 }}>{pending && <motion.span data-button-spinner aria-hidden="true" style={{ width: ".85em", height: ".85em", border: "2px solid currentColor", borderRightColor: "transparent", borderRadius: "50%" }} animate={{ rotate: reduced ? 0 : 360 }} transition={{ duration: .75, repeat: reduced ? 0 : Infinity, ease: "linear" }} />}{children}</motion.span></>}</AriaButton>;
}
