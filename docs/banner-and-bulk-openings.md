# Banner, bulk openings, and daily merchant

## Deployment

Restart the rebuilt backend to apply Flyway V13, which adds the secret relic. V11 keeps its original applied checksum; V12 adds banner associations. Do not edit applied migrations, disable validation, or repair history for this update. V13 has been compiled and unit-tested but has not been applied to the user's database during this implementation.

Skybound Oath starts when V11 is applied and lasts fourteen days. It costs 150 in-game coins per pull. Banner requests accept exactly **1 or 10** pulls; owned-crate bulk openings accept **1–10** distinct crate IDs.

V14 adds gem-funded luck potions. The probabilities below are the unboosted baseline; see [Gems and luck](gems-and-luck.md) for boosted odds and remaining-roll behavior.

## Probability and availability

The limited pool has a **1% combined chance**. With the secret installed, each of the three featured relics has a 0.33% chance, and Eclipse of Tomorrow has a 0.01% chance. The banner API represents the secret as “Secret relic,” with `secret=true` and a null chance; the page displays “odds unknown.” This conceals the presentation, not the source code or the item's identity after discovery.

The other 99% contains standard items, including the existing two ordinary ???? relics. Standard tier weights are Common 59.5%, Basic 25%, Excellent 10%, Exotic 3%, Extraordinary 1%, and standard ???? 0.5%. Items within a tier are equally likely. There is no pity guarantee. Runtime selection uses these pool weights rather than catalog display metadata.

Limited items have `limited=true`, `is_active=false`, and a `limited_banner_code`. Normal crates and the shop exclude limited items, and daily boxes use active items. Earned relics remain usable after the banner ends. The backend rejects new pulls outside the schedule but can replay a completed request after its deadline.

## Transactions and retries

`POST /api/crates/open-bulk` consumes all requested crates, records discoveries and quests, and saves rewards in one transaction. Invalid ownership or any other failure rolls the batch back.

`POST /api/banners/SKYBOUND/pull` checks the schedule, debits the full cost, grants rewards, and saves a receipt in the same transaction.

Both operations lock the player's wallet before checking the receipt. Reusing a request ID and payload returns its saved rewards without another charge or grant. A changed payload is rejected. The frontend retains uncertain failed requests for Retry. Inventory always holds completed rewards; refreshing the browser does not automatically repeat a pull.

## Presentation and interaction

The banner's three podiums place item art, names, and odds together. Standard rewards open in a separate dialog. Summon controls show quantities and costs together. Every single pull uses the reel; rare rewards then use their own reveal. Skip deliberately skips the cutscene as well.

Original reveal and action themes:
- Sunbreak Oathblade: sunrise slash and broad sunlit strike.
- Stormheart Katana: lightning storm and zigzag strike.
- Astral Bastion: celestial shield and orbital guard.
- Eclipse of Tomorrow: black sun, opening rift, and crossed eclipse slashes.

Developer-only preview controls play scenes without any grant or charge. Existing licensed audio is reused. Sound, volume, reduced-motion, and skip preferences apply. Equipped ???? cosmetics never change results or payouts.

### Banner cinematic buildup

The four limited/secret reveals use original illustrated environments with foreground parallax and procedural motion instead of the black-screen prophecy text:

- Eclipse: inward accretion spirals and an obsidian eclipse cathedral.
- Sunbreak: rising forge heat, embers, and a solar altar.
- Stormheart: tidal ribbons, rain, and branching lightning around an ocean shrine.
- Astral: assembling constellation orbits above a celestial bastion.

The music playback position drives camera movement, effect starts, reward arrival, final fade, and completion. Buffering holds the buildup at the same musical position. If autoplay is rejected, the scene uses a silent elapsed-time fallback. The existing audio files, volume multipliers, reveal cues, and total durations are preserved. Reduced motion presents a static illustrated reward and completes after two seconds. Skip/Escape stops music and ambient loops and restores focus and page scrolling.

| Theme | Reward cue | Scene duration | Ambient effect starts |
| --- | --- | --- | --- |
| Eclipse | 7 s | 21 s | None |
| Sunbreak | 9 s | 16 s | 9 s |
| Stormheart | 12 s | 23 s | 7 s |
| Astral | 11 s | 18 s | 6 s |

Browser verification on October 8, 2026 measured reward arrivals at music positions 7.012, 9.007, 12.014, and 11.002 seconds respectively. Each completed at its original duration; skipping stopped both audio channels, and reduced motion omitted the animation canvas. All four music files and three ambient files were checked against Git and remain byte-for-byte identical. Use the developer playground's banner preview buttons to replay each scene without a purchase.

Additional checks covered the integrated `RarityBurst` flow with simulated stalled playback past its former 30-second timeout, silent autoplay fallback, phone-width rendering, and eight rapid play/skip cycles across the four themes. The stalled scene remained skippable without premature completion, silent playback completed normally, and the final rapid-exit check logged no browser errors.

Crate stars become more elaborate by rarity through facets, rings, wings, and an orbital mystery design. Their names remain in surrounding controls so color is not the only identifier.

Milo's Trading Post presents daily crates and coins as two dialogue choices. Existing server claim APIs and reward limits remain authoritative. Dialogue changes move keyboard focus to the new heading, and completed claims give a visible status message.

Settings at `/settings` groups sound controls separately from motion and help. Changes persist in the existing browser preferences. The footer links to Settings, reducing repeated controls across the app. The system's reduced-motion preference is always respected.

## Verification

Targeted backend tests cover opening limits, duplicate/null IDs, pool totals, hidden secret metadata, receipt serialization, retry replay, and changed-payload rejection. Browser fixture checks cover single and ten pulls, previews, merchant claims, persisted settings, keyboard controls, and responsive layouts down to 320×568. Browser tests use mock accounts and rewards; deployment database integration remains unverified.

### Mythic armory artwork

All six named ???? icons share forged-steel material gradients, reinforced fittings, and ceremonial military craftsmanship, implemented as scalable SVG in `MythicArmoryIcon`. Inventory, banner showcases, reward reveals, and inspection dialogs use the same artwork through `ItemIcon`/`RelicIcon`.

- Eclipse of Tomorrow: heavy steel blade, basket guard, pale eclipse inlay.
- Sunbreak Oathblade: curved ceremonial saber, gold fittings, solar flame engraving.
- Stormheart Katana: polished curved blade, blue wrapped grip, lacquered scabbard and lightning/dragon engraving.
- Astral Bastion: reinforced steel shield plates, riveted perimeter and constellation crest.
- Mystery Harbor: dark scabbard, red wrapped grip and etched wave motif.
- Voidseal Aegis: reinforced shield, violet void stone and orbital engraving.

The supplied sword photos informed material, guard, grip and scabbard shapes. Elemental colors and existing reveal/action themes are retained. Gradient identifiers are unique per rendered icon so repeated inventory and banner instances do not share SVG paint references.

### Banner icon metadata
Banner thumbnails and reward-pool icons pass server rarity through ItemIcon, so unfamiliar mystery-tier names still use the forged mythic renderer. The legacy Crimson Veil Katana name resolves to Mystery Harbor's design. Server item types are normalized to lowercase, and thumbnails retain square viewports to avoid clipping.
