// Original procedural reveal cues: charging air, a blade sweep, impact, and echoes.
// No sampled anime audio is used. The caller owns muting and disposal.
export function createMysteryRevealEffects() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return () => {};
    const context = new AudioContext();
    const master = context.createGain();
    const limiter = context.createDynamicsCompressor();
    master.gain.value = .28;
    limiter.threshold.value = -12;
    limiter.ratio.value = 8;
    master.connect(limiter);
    limiter.connect(context.destination);
    const sources = [];
    let stopped = false;

    function tone(start, duration, from, to, volume, type = "sine") {
        const source = context.createOscillator();
        const envelope = context.createGain();
        source.type = type;
        source.frequency.setValueAtTime(from, start);
        source.frequency.exponentialRampToValueAtTime(to, start + duration);
        envelope.gain.setValueAtTime(.0001, start);
        envelope.gain.exponentialRampToValueAtTime(volume, start + .025);
        envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
        source.connect(envelope);
        envelope.connect(master);
        source.start(start);
        source.stop(start + duration);
        sources.push(source);
    }

    function sweep(start, duration, from, to, volume) {
        const source = context.createBufferSource();
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
        source.buffer = buffer;
        const filter = context.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 1.4;
        filter.frequency.setValueAtTime(from, start);
        filter.frequency.exponentialRampToValueAtTime(to, start + duration);
        const envelope = context.createGain();
        envelope.gain.setValueAtTime(.0001, start);
        envelope.gain.exponentialRampToValueAtTime(volume, start + duration * .35);
        envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
        source.connect(filter);
        filter.connect(envelope);
        envelope.connect(master);
        source.start(start);
        source.stop(start + duration);
        sources.push(source);
    }

    void context.resume().then(() => {
        if (stopped) return;
        const start = context.currentTime;
        sweep(start, 1.35, 180, 3800, .65);
        tone(start + .1, 1.2, 90, 520, .2, "triangle");
        sweep(start + 1.15, .45, 5200, 300, 1);
        tone(start + 1.48, .8, 115, 32, .9);
        sweep(start + 1.48, .55, 2100, 110, .6);
        [740, 1110, 1480].forEach((pitch, index) => {
            tone(start + 1.78 + index * .11, 1.5, pitch, pitch * .96, .16);
        });
        sweep(start + 3.2, .65, 900, 3400, .22);
        tone(start + 3.5, 1.1, 1480, 740, .12);
    }).catch(() => stop());

    function stop() {
        if (stopped) return;
        stopped = true;
        sources.forEach(source => { try { source.stop(); } catch { /* Already ended. */ } });
        void context.close().catch(() => {});
    }
    return stop;
}
