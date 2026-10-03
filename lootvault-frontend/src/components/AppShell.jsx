import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Button from "./Button";
import { blip, isMuted, setMuted } from "../sfx";
import { useAuth } from "../auth/AuthContext";
import styles from "./AppShell.module.css";
import { useWallet } from "../wallet/WalletContext";

const TABS = [
    { to: "/menu", label: "Lobby" },
    { to: "/lootboxes", label: "Loot boxes" },
    { to: "/modes", label: "Modes" },
    { to: "/earn", label: "Earn loot" },
    { to: "/inventory", label: "Inventory" },
    { to: "/progression", label: "Progression" },
    { to: "/shop", label: "Shop" },
];

export default function AppShell() {
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
        await logout();
        navigate("/login", { replace: true });
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
                    <span className={styles.chip}><span className={styles.coin} aria-hidden="true" />{wallet ? wallet.softBalance.toLocaleString() : "—"} coins</span>
                </div>
            </header>

            <nav className={styles.tabs} aria-label="Main menu">
                {TABS.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        onClick={() => blip(440, 0.1)}
                        className={({ isActive }) =>
                            `${styles.tab} ${isActive ? styles.active : ""}`
                        }
                    >
                        <span>{tab.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className={styles.content} key={location.pathname}>
                <Outlet />
            </div>

            <footer className={styles.bottom}>
                <span className={styles.identity}><span className={styles.statusDot} aria-hidden="true" />Signed in as <strong>{player?.username}</strong></span>
                <div className={styles.actions}>
                    <a href="/audio-credits.html" target="_blank" rel="noreferrer" style={{ fontSize: ".7rem" }}>Audio credits</a>
                    <Button variant="secondary" size="sm" onClick={toggleSound}>
                        Sound: {muted ? "Off" : "On"}
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleLogout}>
                        Log out
                    </Button>
                </div>
            </footer>
        </div>
    );
}
