import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import OnboardingGate from "../onboarding/OnboardingGate";
import ModeIcon from "./ModeIcon";
import { useReducedMotion, setReducedMotion } from "../preferences/motion";
import Button from "./Button";
import { blip, isMuted, setMuted } from "../sfx";
import { useAuth } from "../auth/AuthContext";
import styles from "./AppShell.module.css";
import { useWallet } from "../wallet/WalletContext";

const TABS = [
    {to:"/menu", label:"Lobby", icon:"crates"},
    {to:"/earn", label:"Earn loot", icon:"earn"},
    {to:"/crates", label:"Crates", icon:"crates"},
    {to:"/lootboxes", label:"Daily boxes", icon:"sandbox"},
    {to:"/inventory", label:"Inventory", icon:"crafting"},
    {to:"/progression", label:"Quests", icon:"progression"},
    {to:"/shop", label:"Shop", icon:"banners"},
];

export default function AppShell() {
    const reducedMotion = useReducedMotion();
    const [sessionError, setSessionError] = useState("");
    useEffect(() => { document.documentElement.dataset.reducedMotion = String(reducedMotion); }, [reducedMotion]);
    const navigate = useNavigate();
    const location = useLocation();
    const [muted, setMutedState] = useState(isMuted());
    const { player, logout } = useAuth();
    const { wallet } = useWallet();

    function toggleSound() {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
    }

    async function handleLogout() {
        try { await logout(); navigate("/login", { replace: true }); }
        catch { setSessionError("Could not log out. Check your connection and try again."); }
    }

    return (
        <div className={styles.shell}>
            <header className={styles.top}>
                <div className={styles.logoPlate}>
          <span className={styles.logo}>
            Loot<b>Vault</b>
          </span>
                </div>
                <div className={styles.currencies} aria-label="Wallet" aria-live="polite" aria-atomic="true">
                    <span className={styles.chip}><span className={styles.coin} aria-hidden="true" />{wallet?.unlimited ? "∞" : wallet ? wallet.softBalance.toLocaleString() : "—"} coins{wallet?.unlimited ? " · DEV" : ""}</span>
                </div>
            </header>

            <nav className={styles.tabs} aria-label="Main menu">
                {TABS.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        onClick={event => { blip(440, 0.1); if (!reducedMotion) event.currentTarget.animate([{transform:"scale(.96)"},{transform:"scale(1)"}],{duration:220}); }}
                        className={({ isActive }) =>
                            `${styles.tab} ${isActive ? styles.active : ""}`
                        }
                    >
                        <ModeIcon mode={tab.icon} size={22}/><span>{tab.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className={styles.content} key={location.pathname}>
                <Outlet />
            </div>

            <OnboardingGate key={player?.id || player?.username} />
            {sessionError && <p role="alert">{sessionError}</p>}
            <footer className={styles.bottom}>
                <span className={styles.identity}>Signed in as <strong>{player?.username}</strong></span>
                <div className={styles.actions}>
                    <a href="/audio-credits.html" target="_blank" rel="noreferrer" style={{ fontSize: ".7rem" }}>Audio credits</a>
                    <Button variant="secondary" size="sm" onClick={toggleSound}>
                        Sound: {muted ? "Off" : "On"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setReducedMotion(!reducedMotion)}>Motion: {reducedMotion ? "Reduced" : "Full"}</Button>
                    <Button variant="secondary" size="sm" onClick={() => window.dispatchEvent(new Event("lootvault:replay-tutorial"))}>Tutorial</Button>
                    <Button variant="danger" size="sm" onClick={handleLogout}>
                        Log out
                    </Button>
                </div>
            </footer>
        </div>
    );
}
