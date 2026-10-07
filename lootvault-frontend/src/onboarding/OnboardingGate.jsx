import { lazy, Suspense, useEffect, useState } from "react";
import { api } from "../api/client";
import { getEarnState } from "../api/earn";
const FirstVisitTutorial = lazy(() => import("./FirstVisitTutorial"));
import Button from "../components/Button";

export default function OnboardingGate() {
    const [open, setOpen] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dailyCoins, setDailyCoins] = useState(500);

    function load() {
        return api.get("/api/onboarding").then(status => {
            setCompleted(status.completed);
            setOpen(!status.completed);
            setError("");
        }).catch(() => setError("Couldn't load your first-visit tour."));
    }

    useEffect(() => {
        let alive = true;
        api.get("/api/onboarding").then(status => {
            if (alive) {
                setCompleted(status.completed);
                setOpen(!status.completed);
            }
        }).catch(() => { if (alive) setError("Couldn't load your first-visit tour."); });
        getEarnState().then(state => {
            if (alive) setDailyCoins(state.daily.coins);
        }).catch(() => {});
        const replay = () => { setError(""); setOpen(true); };
        window.addEventListener("lootvault:replay-tutorial", replay);
        return () => {
            alive = false;
            window.removeEventListener("lootvault:replay-tutorial", replay);
        };
    }, []);

    async function finish() {
        if (saving) return;
        if (completed) { setOpen(false); return; }
        setSaving(true);
        setError("");
        try {
            await api.post("/api/onboarding/complete");
            window.dispatchEvent(new Event("lootvault:onboarding-complete"));
            setCompleted(true);
            setOpen(false);
        } catch (error) {
            setError(error.message || "Couldn't save the tour. Try again.");
        } finally {
            setSaving(false);
        }
    }

    return <>
        {open && <Suspense fallback={<p role="status">Loading your first-visit tour…</p>}>
            <FirstVisitTutorial onFinish={finish} saving={saving} error={error} dailyCoins={dailyCoins}/>
        </Suspense>}
        {!open && error && <p role="status" style={{padding: "1rem"}}>
            {error} <Button variant="secondary" size="sm" onClick={load}>Retry tutorial</Button>
        </p>}
    </>;
}
