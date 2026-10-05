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

The River loops Monarch only after a premium hand or strong draw triggers intensity. It stays on through later cards, even if the draw misses, and through a close-showdown shooting-star reveal. It stops at the final result, on leaving the page, or when music/site sound is disabled. Ordinary hands that never trigger intensity stay silent.


## Crowd boos — NeoSpica
`crowd-boos-neospica.mp3` is the unmodified high-quality preview of "Booing Crowd" by NeoSpica, a mix of CC0 recordings. Source: https://freesound.org/people/NeoSpica/sounds/504621/ . License: CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Retrieved 2026-10-03. Close blackjack dealer wins play a 4.8-second excerpt after the three-second blackout. Player wins reuse the credited RHumphries audience applause recording. All audience reactions stop when the reveal closes and respect the sound toggle.

## Glass shatter — C_Rogers
`glass-shatter-c-rogers.mp3` is the unmodified high-quality preview of glass-shattering_05.ogg by C_Rogers. Source: https://freesound.org/people/C_Rogers/sounds/203377/ . Asset: https://cdn.freesound.org/previews/203/203377_3569783-hq.mp3 . License: CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Retrieved 2026-10-04. Plays once at full volume when four-of-a-kind or straight flush first appears; respects mute and stops on leaving the hand.

## Heavenly Loop — isaiah658
`heavenly-loop-isaiah658.ogg` is an unmodified CC0 choir loop by isaiah658, now used for the River's extreme atmosphere instead of Monarch. Source: https://opengameart.org/content/heavenly-loop . Asset: https://opengameart.org/sites/default/files/Heavenly%20Loop_0.ogg . License: CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Retrieved 2026-10-04. This is a heavenly alternative, not music from the Gurren Lagann soundtrack. It starts at 0:30 (wrapped within the loop when shorter), builds with intensity, and fades after the star animation. Monarch remains used for the mystery item reveal.

## Battle and interface audio update — 2026-10-04
`hard-battle-2-mintodog.mp3`: unmodified Hard Battle 2 (140 BPM) by MintoDog, CC0. https://opengameart.org/content/hard-battle-2 . Source asset: https://opengameart.org/sites/default/files/hard_battle_2_bpm140.mp3 . Replaces Heavenly Loop for four-of-a-kind/straight-flush River music; starts at 0:30 and fades after the cinematic. Lower made hands (two pair through full house) retain Monarch. The choir overlay remains available at extreme intensity.
`kenney-*.ogg`: unmodified files click_003, confirmation_002, back_002, drop_003, maximize_001 from Kenney Interface Sounds, CC0. https://kenney.nl/assets/interface-sounds . Used for button selection, confirmation, back/danger actions, crate reel ticks and reward accents. These are independent game sounds, not Fortnite recordings. All respect the app's sound toggle; simultaneous effects are capped.

Result jingles: Kenney Music Jingles, CC0/public domain. kenney-win.ogg = jingles_STEEL00; kenney-loss.ogg = jingles_STEEL16. Source: https://kenney.nl/assets/music-jingles. License included as Kenney-Jingles-License.txt.
# Original mystery reveal effects

The charge, blade sweep, sub-bass impact, and harmonic echoes in `src/audio/mysteryRevealEffects.js` are original procedural Web Audio sounds, layered over the credited mystery music. They stop when the reveal closes or the site is muted. They contain no anime samples.
