import { Button, ConfigProvider } from "antd";
import { useReducedMotion } from "../preferences/motion";
import { playGameEffect } from "../sfx";

const theme = { token: { fontFamily: "Roboto, sans-serif", colorPrimary: "#78cfc5", colorTextLightSolid: "#000000", borderRadius: 12 } };

// Ant Design's gradient-button example adapted to the cool table palette.
export default function BetButton({ pending = false, disabled, onClick, children, ...props }) {
    const reduced = useReducedMotion();
    return <ConfigProvider theme={theme} wave={{ disabled: reduced }}>
        <Button {...props} htmlType="button" type="primary" data-bet-button data-variant="primary" loading={pending} disabled={disabled || pending} aria-busy={pending || undefined} onClick={event => {
            playGameEffect("confirm", .45, 1);
            onClick?.(event);
        }}>{children}</Button>
    </ConfigProvider>;
}
