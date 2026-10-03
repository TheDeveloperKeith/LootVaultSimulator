# Reveal audio

`exotic-rain.wav` and `mystery-ambience.wav` are original synthesized stereo assets created for LootVault. They contain no sampled third-party music. Reproduce them with `node scripts/generate-reveal-audio.mjs` from the frontend directory.

Rain layers filtered rainfall, droplets, and a wind bed. Mystery layers a pulsing low drone, rising sweep, a bass impact and blade transient at 1.49 seconds, and distant inharmonic chimes. The impact is timed to the red sword cutting across the reveal. Both are 4.8 seconds with baked-in fades, PCM 16-bit at 22050 Hz. Playback respects the site's sound toggle and stops when the reveal unmounts.

## Monarch — Dutonic

`monarch-dutonic.mp3` is the unmodified download of Monarch by Dutonic, tagged Sol's RNG by the artist on Newgrounds.
Source: https://www.newgrounds.com/audio/listen/1523222
Artist: https://dutonic.newgrounds.com/
License: CC BY 3.0 https://creativecommons.org/licenses/by/3.0/
Retrieved 2026-10-03. The app plays a 4.8-second timed excerpt beginning at 0:30 with a playback fade. Credits are available in the app footer and `/audio-credits.html`.
The source notes third-party samples and advises consulting author comments/contacting the artist for sample details; this notice is retained. The original generated mystery-ambience.wav remains available as an alternative, but is no longer used in the mystery reveal.

Real theatre applause: Applause-2 by RHumphries, CC BY 3.0. Source: https://commons.wikimedia.org/wiki/File:Applause-2.ogg . Unmodified recording; playback uses a faded excerpt starting at 0:04.

The River also loops Monarch with quieter baseline playback and louder premium-hand/draw cues. It stops when the hand finishes or music/site sound is disabled.

