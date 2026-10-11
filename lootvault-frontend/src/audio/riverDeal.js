import cardsAudio from "../assets/audio/playing-cards-kevinhilt.wav";
import { effectVolume } from "./volume";
import { isMuted } from "../sfx";

// Called directly from the Deal gesture so browsers can authorize audio playback.
export function startRiverDealSound() {
    if (isMuted()) return () => {};
    const audio = new Audio(cardsAudio);
    audio.loop = true;
    const unregister = effectVolume(audio, .8);
    let stopped = false;
    function stop() {
        if (stopped) return;
        stopped = true;
        audio.pause();
        unregister();
        window.removeEventListener("lootvault:sound-changed", changed);
    }
    function changed() { if (isMuted()) stop(); }
    window.addEventListener("lootvault:sound-changed", changed);
    audio.play().catch(stop);
    return stop;
}
