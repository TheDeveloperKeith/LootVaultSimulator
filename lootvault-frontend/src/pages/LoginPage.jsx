import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { devStatus } from "../api/auth";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import ScreenDialog from "../components/ScreenDialog";
import PrimitiveButtonGroup from "../components/PrimitiveButtonGroup";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import styles from "./LoginPage.module.css";

const LoginShowcase = lazy(() => import("../components/LoginShowcase"));

export default function LoginPage() {
    const { login, register, player, devLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState("login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [devEnabled, setDevEnabled] = useState(false);
    const [showDev, setShowDev] = useState(false);
    const [phrase, setPhrase] = useState("");
    const [devError, setDevError] = useState("");
    const requestBusy = useRef(false);
    const errorSummary = useRef(null);
    useEffect(() => { let alive = true; devStatus().then(data => { if (alive) setDevEnabled(data.enabled); }).catch(() => {}); return () => { alive = false; }; }, []);
    useEffect(() => { if (error) errorSummary.current?.focus(); }, [error]);

    function switchMode(next) {
        if (requestBusy.current) return;
        setMode(next); setError(null); setPassword(""); setShowPassword(false);
    }
    async function enterDev(event) {
        event.preventDefault();
        if (requestBusy.current) return;
        requestBusy.current = true; setSubmitting(true); setDevError("");
        try { await devLogin(phrase); setPhrase(""); navigate("/menu", { replace: true }); }
        catch (error) { setDevError(error.status === 401 ? "That developer phrase doesn't match." : error.message || "Couldn't enter testing mode."); }
        finally { requestBusy.current = false; setSubmitting(false); }
    }
    async function handleSubmit(event) {
        event.preventDefault();
        if (requestBusy.current) return;
        requestBusy.current = true; setError(null); setSubmitting(true);
        try {
            if (mode === "login") await login(username.trim(), password);
            else await register(username.trim(), email.trim(), password);
            navigate(location.state?.from || "/menu", { replace: true });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "We couldn't connect. Please try again.");
        } finally { requestBusy.current = false; setSubmitting(false); }
    }
    if (player) return <Navigate to={location.state?.from || "/menu"} replace />;
    const creating = mode === "register";
    const working = creating ? "Creating your account…" : "Signing you in…";

    return <main className={styles.page}>
        <div className={styles.layout}>
            <div className={styles.showcasePane}><Suspense fallback={<section className={styles.showcaseFallback}><h1>Play cards. Collect original gear.</h1><p>Poker, blackjack, crates, and limited banners. In-game currency only.</p></section>}><LoginShowcase /></Suspense></div>
            <div className={styles.loginStack}>
                <div className={styles.mobileBrand}><span className={styles.brandMark} aria-hidden="true">LV</span>LootVault</div><p className={styles.mobileIntro}>Play poker and blackjack. Open crates.<br />Build a collection of original gear.</p>
                <section className={styles.card} aria-labelledby="auth-title">
                    <PrimitiveButtonGroup className={styles.tabs} aria-label="Account access">
                        <button type="button" aria-pressed={!creating} disabled={submitting} onClick={() => switchMode("login")}>Sign in</button>
                        <button type="button" aria-pressed={creating} disabled={submitting} onClick={() => switchMode("register")}>Create account</button>
                    </PrimitiveButtonGroup>
                    <header className={styles.formIntro}><h2 id="auth-title">{creating ? "Create your account" : "Welcome back"}</h2><p>{creating ? "Your next discovery starts here." : "Your card tables and collection are waiting."}</p></header>
                    {location.state?.message && <p className={styles.notice} role="status">{location.state.message}</p>}
                    <form onSubmit={handleSubmit} aria-labelledby="auth-title" aria-busy={submitting} className={styles.form}>
                        <label className={styles.field} htmlFor="auth-username">Username<input id="auth-username" name="username" value={username} onChange={event => { setUsername(event.target.value); setError(null); }} required minLength={3} autoComplete="username" autoCapitalize="none" spellCheck={false} readOnly={submitting} /></label>
                        {creating && <label className={styles.field} htmlFor="auth-email">Email address<input id="auth-email" name="email" type="email" value={email} onChange={event => { setEmail(event.target.value); setError(null); }} required autoComplete="email" autoCapitalize="none" readOnly={submitting} /></label>}
                        <div className={styles.field}><label htmlFor="auth-password">Password</label><div className={styles.passwordField}><input id="auth-password" name="password" type={showPassword ? "text" : "password"} value={password} onChange={event => { setPassword(event.target.value); setError(null); }} required minLength={6} autoComplete={creating ? "new-password" : "current-password"} aria-describedby={creating ? "password-help" : undefined} readOnly={submitting} /><button type="button" className={styles.showPassword} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} aria-controls="auth-password" onClick={() => setShowPassword(value => !value)}>{showPassword ? "Hide" : "Show"}</button></div>{creating && <small id="password-help">Use at least 6 characters.</small>}</div>
                        {error && <p ref={errorSummary} tabIndex={-1} role="alert" className={styles.error}>{error}</p>}
                        <button type="submit" className={styles.submit} disabled={submitting}>{submitting ? <><span className={styles.spinner} aria-hidden="true" />{working}</> : <>{creating ? "Create account" : "Sign in"}<span aria-hidden="true">→</span></>}</button>
                        <p className={styles.feedback} role="status" aria-live="polite">{submitting ? working : ""}</p>
                    </form>
                    <p className={styles.formNote}>In-game currency. No cash payouts.</p>
                </section>
                {devEnabled && <button type="button" className={styles.devLink} disabled={submitting} onClick={() => setShowDev(true)}>Developer playground</button>}
            </div>
        </div>
        {showDev && <ScreenDialog title="Developer playground" onClose={() => { if (!requestBusy.current) { setShowDev(false); setPhrase(""); setDevError(""); } }}><p>A separate test vault with coins that never run out.</p><form className={styles.devForm} onSubmit={enterDev}><label className={styles.field}>Developer phrase<input type="password" autoComplete="off" value={phrase} onChange={event => setPhrase(event.target.value)} required maxLength={256} readOnly={submitting} /></label>{devError && <p className={styles.error} role="alert">{devError}</p>}<button type="submit" className={styles.submit} disabled={submitting}>{submitting ? "Opening test vault…" : "Enter test vault"}</button></form></ScreenDialog>}
    </main>;
}
