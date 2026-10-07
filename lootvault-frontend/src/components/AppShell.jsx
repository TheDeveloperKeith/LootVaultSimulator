import GemIcon from "./GemIcon";
import { getTodayGrant } from "../api/game";
import VaultLogo from "./VaultLogo";
import DailyRewards from "./DailyRewards";
import CrateIcon from "./CrateIcon";
import { getMyCrates } from "../api/crates";
import { playCrateNotification } from "../sfx";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import OnboardingGate from "../onboarding/OnboardingGate";
import ModeIcon from "./ModeIcon";
import { useReducedMotion } from "../preferences/motion";
import Button from "./Button";
import { blip } from "../sfx";
import { useAuth } from "../auth/AuthContext";
import styles from "./AppShell.module.css";
import { useWallet } from "../wallet/WalletContext";

const TABS = [
    {to:"/menu", label:"Lobby", icon:"crates"},
    {to:"/earn", label:"Earn loot", icon:"earn"},
    {to:"/banners",label:"Banners",icon:"banners"},
    {to:"/crates", label:"Crates", icon:"crates"},
    {to:"/inventory", label:"Inventory", icon:"crafting"},
    {to:"/progression", label:"Quests", icon:"progression"},
];

export default function AppShell() {
    const [dailyCount,setDailyCount]=useState(0);
    useEffect(()=>{let alive=true;const sync=()=>getTodayGrant().then(grant=>{if(alive)setDailyCount(grant.boxesRemaining);}).catch(()=>{});sync();window.addEventListener("lootvault:daily-changed",sync);window.addEventListener("focus",sync);return()=>{alive=false;window.removeEventListener("lootvault:daily-changed",sync);window.removeEventListener("focus",sync);};},[]);
    const [notification, setNotification] = useState(null);
    const [crateCount, setCrateCount] = useState(0);
    useEffect(() => { let alive = true; let generation = 0; const sync = () => { const request = ++generation; getMyCrates().then(crates => { if (alive && request === generation) setCrateCount(crates.length); }).catch(() => {}); }; sync(); const receive = event => { setNotification({...event.detail, key:Date.now()}); setCrateCount(count => Math.max(0,count + (event.detail.delta || 0))); playCrateNotification(); sync(); }; const consumed = () => { setCrateCount(count => Math.max(0,count - 1)); sync(); }; window.addEventListener("lootvault:crate-notification",receive); window.addEventListener("lootvault:crate-consumed",consumed); return () => { alive = false; window.removeEventListener("lootvault:crate-notification",receive); window.removeEventListener("lootvault:crate-consumed",consumed); }; }, []);
    useEffect(() => { if (!notification) return; const timer = setTimeout(() => setNotification(null),6000); return () => clearTimeout(timer); }, [notification]);
    const reducedMotion = useReducedMotion();
    const [sessionError, setSessionError] = useState("");
    useEffect(() => { document.documentElement.dataset.reducedMotion = String(reducedMotion); }, [reducedMotion]);
    const navigate = useNavigate();
    const location = useLocation();
    const { player, logout } = useAuth();
    const { wallet } = useWallet();

    async function handleLogout() {
        try { await logout(); navigate("/login", { replace: true }); }
        catch { setSessionError("Could not log out. Check your connection and try again."); }
    }

    return (
        <div className={`${styles.shell} ${location.pathname !== "/inventory" ? styles.screenShell : ""}`}>
            <header className={styles.top}>
                <NavLink to="/menu" className={styles.logoPlate} aria-label="LootVault lobby"><VaultLogo/></NavLink>
                <div className={styles.currencies} aria-label="Wallet" aria-live="polite" aria-atomic="true">
                    <span className={`${styles.chip} ${styles.gemChip}`}><GemIcon size={26}/>{wallet?.unlimited ? "∞" : wallet ? (wallet.gemBalance ?? wallet.hardBalance).toLocaleString() : "—"} gems</span>
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
                        <ModeIcon mode={tab.icon} size={22}/><span>{tab.label}</span>{tab.to === "/menu" && dailyCount > 0 && <span className={styles.dailyBadge} aria-label={`${dailyCount} daily crates ready`}>{dailyCount}</span>}{tab.to === "/crates" && crateCount > 0 && <span className={styles.navBadge}>{crateCount > 99 ? "99+" : crateCount}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className={styles.content} data-game-theme={!["/inventory", "/banners"].includes(location.pathname) ? "arcade" : undefined} key={location.pathname}>
                <Outlet />
            </div>

            {notification && <aside key={notification.key} className={styles.notification} role="status" aria-live="polite"><CrateIcon code={notification.code || "COMMON"} size={42}/><div><strong>{notification.title || "Vault delivery"}</strong><p>{notification.message}</p><button onClick={() => { setNotification(null); navigate(notification.target || "/crates?view=owned"); }}>{notification.target === "/inventory" ? "View vault ↗" : "View cases ↗"}</button></div><button className={styles.dismissNotification} aria-label="Dismiss notification" onClick={() => setNotification(null)}>×</button></aside>}
            <DailyRewards />
            <OnboardingGate key={player?.id || player?.username} />
            {sessionError && <p role="alert">{sessionError}</p>}
            <footer className={styles.bottom}>
                <span className={styles.identity}>Signed in as <strong>{player?.username}</strong></span>
                <div className={styles.actions}>
                    <Button variant="secondary" size="sm" onClick={() => navigate("/settings")}>Settings</Button>
                    <Button variant="danger" size="sm" onClick={handleLogout}>
                        Log out
                    </Button>
                </div>
            </footer>
        </div>
    );
}
