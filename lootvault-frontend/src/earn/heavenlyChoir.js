// Original synthesized vowel choir: layered voices, slow vibrato and a long hall tail.
// Its level can change without restarting the voices or the underlying music.
export function createHeavenlyChoir() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = 0;
    const reverb = context.createConvolver();
    const impulse = context.createBuffer(2, context.sampleRate * 4, context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
        const samples = impulse.getChannelData(channel);
        for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples.length, 3);
    }
    reverb.buffer = impulse;
    const wet = context.createGain(); wet.gain.value = .6;
    master.connect(context.destination); master.connect(reverb); reverb.connect(wet); wet.connect(context.destination);
    const oscillators = [];
    // A suspended open fifth, deliberately without a major/minor third.
    for (const frequency of [130.81, 196, 261.63, 392, 523.25]) {
        for (const detune of [-7, 7]) {
            const voice = context.createOscillator(); voice.type = 'sawtooth';
            voice.frequency.value = frequency; voice.detune.value = detune;
            const vibrato = context.createOscillator(); vibrato.frequency.value = 4.5 + frequency / 1500;
            const depth = context.createGain(); depth.gain.value = 4;
            vibrato.connect(depth); depth.connect(voice.detune);
            for (const [formant, gain] of [[700,.018],[1200,.01],[2600,.003]]) {
                const filter = context.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = formant; filter.Q.value = 5;
                const volume = context.createGain(); volume.gain.value = gain;
                voice.connect(filter); filter.connect(volume); volume.connect(master);
            }
            voice.start(); vibrato.start(); oscillators.push(voice, vibrato);
        }
    }
    return {
        async setLevel(level) {
            master.gain.cancelScheduledValues(context.currentTime);
            master.gain.setTargetAtTime(level, context.currentTime, .7);
            if (level > 0) await context.resume();
        },
        stop() { oscillators.forEach(voice => voice.stop()); void context.close(); }
    };
}
