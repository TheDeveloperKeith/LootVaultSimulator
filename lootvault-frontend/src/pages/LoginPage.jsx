import { useEffect, useState } from "react";
import { devStatus } from "../api/auth";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
    const { login, register, player, devLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [mode, setMode] = useState("login"); // "login" | "register"
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [devEnabled, setDevEnabled] = useState(false);
    const [phrase, setPhrase] = useState("");
    const [devError, setDevError] = useState("");
    useEffect(() => { let alive = true; devStatus().then(data => { if (alive) setDevEnabled(data.enabled); }).catch(() => {}); return () => { alive = false; }; }, []);
    async function enterDev(event) {
        event.preventDefault(); setSubmitting(true); setDevError("");
        try { await devLogin(phrase); setPhrase(""); navigate("/menu", {replace:true}); }
        catch (error) { setDevError(error.status === 401 ? "That developer phrase doesn't match." : error.message || "Couldn't enter testing mode."); }
        finally { setSubmitting(false); }
    }

    // Already logged in (e.g. navigated here manually) — bounce to the lobby.
    if (player) {
        const dest = location.state?.from || "/menu";
        return <Navigate to={dest} replace />;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            if (mode === "login") {
                await login(username, password);
            } else {
                await register(username, email, password);
            }
            navigate(location.state?.from || "/menu", { replace: true });
        } catch (err) {
            // ApiError carries the backend's message (e.g. "Username already taken");
            // anything else (network down, etc.) gets a generic fallback.
            setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className={styles.page}>
            <section className={styles.hero} aria-label="LootVault introduction">
                <div className={styles.eyebrow}>

                    Build your vault
                </div>

                <h1 className={styles.heroTitle}>
                    Collect.<br />
                    Learn.<br />
                    <span>Unbox.</span>
                </h1>

                <p className={styles.heroCopy}>
                    Discover original equipment, learn a few card games, and grow a collection at your own pace.
                </p>

                <div className={styles.rarityRail} aria-hidden="true">
                    <span className={styles.common} />
                    <span className={styles.basic} />
                    <span className={styles.excellent} />
                    <span className={styles.exotic} />
                    <span className={styles.extraordinary} />
                    <span className={styles.mystery} />
                </div>
                {devEnabled && <details className={styles.devEntry}><summary>Developer playground <span>∞</span></summary><p>A separate test vault with coins that never run out.</p><form onSubmit={enterDev}><label className={styles.field}>Developer phrase<input type="password" autoComplete="off" value={phrase} onChange={event => setPhrase(event.target.value)} required maxLength={256} /></label>{devError && <p className={styles.error} role="alert">{devError}</p>}<Button type="submit" disabled={submitting}>Enter test vault</Button></form></details>}
            </section>

            <form className={styles.card} onSubmit={handleSubmit}>
                {location.state?.message && <p role="status">{location.state.message}</p>}
                <div className={styles.brandRow}>
                    <h2 className={styles.title}>
                        Loot<span>Vault</span>
                    </h2>
                    <span className={styles.brandMark} aria-hidden="true">LV</span>
                </div>

                <div className={styles.formIntro}>
                    <h3>{mode === "login" ? "Welcome back" : "Create your vault"}</h3>
                    <p>
                        {mode === "login"
                            ? "Sign in to continue where you left off."
                            : "Start collecting and build a vault that's yours."}
                    </p>
                </div>

                <div className={styles.tabs}>
                    <button
                        type="button"
                        className={mode === "login" ? styles.tabActive : styles.tab}
                        aria-pressed={mode === "login"}
                        onClick={() => setMode("login")}
                    >
                        Log in
                    </button>
                    <button
                        type="button"
                        className={mode === "register" ? styles.tabActive : styles.tab}
                        aria-pressed={mode === "register"}
                        onClick={() => setMode("register")}
                    >
                        Register
                    </button>
                </div>

                <label className={styles.field}>
                    Username
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={3}
                        autoComplete="username"
                    />
                </label>

                {mode === "register" && (
                    <label className={styles.field}>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </label>
                )}

                <label className={styles.field}>
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <Button type="submit" size="lg" disabled={submitting} className={styles.submit}>
                    {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
                </Button>
            </form>
        </div>
    );
}
