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

Crate stars become more elaborate by rarity through facets, rings, wings, and an orbital mystery design. Their names remain in surrounding controls so color is not the only identifier.

Milo's Trading Post presents daily crates and coins as two dialogue choices. Existing server claim APIs and reward limits remain authoritative. Dialogue changes move keyboard focus to the new heading, and completed claims give a visible status message.

Settings at `/settings` groups sound controls separately from motion and help. Changes persist in the existing browser preferences. The footer links to Settings, reducing repeated controls across the app. The system's reduced-motion preference is always respected.

## Verification

Targeted backend tests cover opening limits, duplicate/null IDs, pool totals, hidden secret metadata, receipt serialization, retry replay, and changed-payload rejection. Browser fixture checks cover single and ten pulls, previews, merchant claims, persisted settings, keyboard controls, and responsive layouts down to 320×568. Browser tests use mock accounts and rewards; deployment database integration remains unverified.
