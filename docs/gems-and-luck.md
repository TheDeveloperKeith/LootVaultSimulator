# Gems and luck potions

Gems are an earned in-game currency, distinct from coins. The original pink/lilac mascot icon is a local SVG, drawn with simple facets, a cheerful face, and a blue point. Each page uses its existing buttons and layout.

## Player flow

- **Daily rewards in the lobby:** claim 5 gems per calendar day in the configured game timezone (America/New_York by default). Coins and crates have their own claims.
- **Crate exchange → Your cases:** exchange one unopened Mystery Crate for 10 gems. Confirming consumes the crate; no item is rolled. Other crate types are not eligible.
- **The River / Jack No Black:** choose Coins or Gems before dealing. Stakes are 10–100% of the selected wallet balance, rounded up to whole units. Raises and calls use that hand's currency. Returns follow the existing game rules, include the stake, and pay the same currency. Stakes can be lost. An unfinished hand keeps its denomination when resumed.
- **Exclusive Shop or Banners → Luck potions:** Lucky costs 10 gems and gives 2.5× featured odds; Ultra Lucky costs 25 gems and gives 5.5× featured odds. Buying activates the potion immediately for the next 10 banner rolls. Potions do not stack or replace an active potion. Normal/daily crate openings do not consume the effect.
- The banner displays the current boosted probabilities and rolls left. A 10-roll summon consumes only the remaining boosted rolls, then uses base odds for the rest. Every roll is independent; luck does not guarantee a reward.

## Probability

With the secret available, each featured relic has 0.33% base probability, 0.825% with Lucky, and 1.815% with Ultra Lucky. The secret remains at 0.01% in all cases, although its odds stay concealed on the page. Standard outcomes receive the remaining probability: 99%, 97.515%, or 94.545%. Their relative rarity distribution stays the same.

`BannerOdds` supplies both presentation and runtime probabilities. Catalog drop-rate metadata is not used as the boosted runtime probability.

## Backend and retries

Gems reuse `wallets.hard_balance` and the existing HARD ledger currency; `gemBalance` is the public wallet alias. Coins remain SOFT. No separate balance exists in browser storage. Gem earnings, stakes, payouts, and potion purchases have ledger rows.

Flyway V14 adds daily gem claims, gem-operation receipts, wallet potion state, and a currency column on table history. Historical rounds default to SOFT; their JSON state also defaults to SOFT.

Flyway V15 stores decimal luck multipliers and upgrades active Lucky/Ultra Lucky potions to 2.5×/5.5× without resetting remaining rolls. It renames Crimson Veil Katana to Mystery Harbor, preserving owned catalog IDs and its reveal, and updates existing shop offers to 100,000 coins. Weekly offers use the same price. Restart the backend to apply V15.

All mutations lock the player's wallet. A unique player/day claim prevents repeat daily awards. Crate exchanges validate ownership and type, then delete and credit within one transaction. Purchases and exchanges use request IDs and fingerprints, so retries cannot charge or credit again; reusing an ID for a different operation is rejected. Banner receipts prevent retries from consuming potion charges twice. Each new roll decrements potion state in the same transaction as its reward, and the final boosted roll resets the multiplier to 1.

Developer sessions receive a gem reference balance and retain the existing no-debit/no-payout sandbox behavior. Production cannot enable the developer entry.

## Running and verification

Restart the rebuilt backend to let Flyway apply **V14** before using the new frontend. V14 was applied and the flows tested in an isolated PostgreSQL 16 instance; the user's game database was not changed.

`GemServiceTest` covers daily replay, exchange validation, purchase replay, non-stacking, insufficient funds, and probability mass. `GemDatabaseTest` is opt-in and tests actual PostgreSQL transactions, eight concurrent daily claims, mixed boosted/unboosted bulk rolls, retries, and both gem card games. Run `./mvnw test -Dgem.test.url=jdbc:postgresql://127.0.0.1:PORT/DATABASE` only against a disposable database owned by the `gem_test` test role. The test starts Spring on a random port and ignores application-local properties.

An existing fresh-install conflict was discovered: V1 and V5 create incompatible `pity_counters` tables. Historical SQL and applied checksums were left unchanged. The integration fixture first migrates to V4, removes only its empty legacy pity table, then applies the remaining migrations. This fixture normalization is for disposable databases only, not a production repair instruction. A fresh deployment still needs a separately planned migration-baseline fix.

Validated: 74 backend tests including four database integration tests, frontend lint/build, and desktop/phone preview layouts. Temporary database, browser tab, and preview fixture are removed after verification.
