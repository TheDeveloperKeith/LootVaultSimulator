# LootVault MVP readiness — 5 October 2026

The scope is frozen around blackjack, The River, crates and daily boxes, shop, inventory, and five simple quests. Sandbox remains secondary practice. Limited banners now join the primary flow; crafting remains unfinished. See [banner and bulk opening notes](banner-and-bulk-openings.md) for the V11–V13 rollout and verification limits.

## Implemented

- Account-persisted first-visit tour with skip and footer replay.
- A no-wager River demo covering calm, two pair, flush potential, full house, four of a kind, scattering, and the sky reveal. Preview sound and shaking require opting in.
- Separate persistent sound and motion controls, system reduced-motion support, keyboard dialog focus, and button/navigation feedback.
- Session-race handling, normal signed-out responses, session rotation, CSRF-protected writes, and configurable exact frontend origins.
- Arbitrary wallet credit and another player's wallet routes blocked.
- Consistent wallet locking around spending, daily grants, claims, crate consumption, and discovery rewards. Crate and daily-box discoveries now update collection and quests in their awarding transaction.
- Five active participation quests. Legacy completed quests remain claimable before expiration. No new crafting or win-dependent quests.
- Daily odds calculated from active catalog weights. Removed a pity guarantee that the opening service did not implement.
- Source-derived savings estimates and smaller one-time collection bonuses. No existing payout was reclaimed.
- Flyway V9 stores tutorial completion; V10 recovers discoveries from still-owned inventory.
- Production secure cookie settings, explicit developer-mode shutdown, packaged frontend routes, CI checks, a publish scan, and a backup/restore verification script.
- Four of a kind and straight flush retain the earlier table lighting and shake strength, with six colliding stars in the reveal. The River uses a wide rectangular table with embedded Check, Raise, and Fold controls; Call replaces Check when matching an AI bet. Mystery crate reveals add original procedural charge, blade sweep, bass impact, and harmonic echoes; muting or closing disposes their audio.

## Verification performed locally

| Check | Result |
| --- | --- |
| Java regression tests | 55 passed |
| Frontend production build and lint | Passed |
| Atmosphere and pitch regressions | 26 and 7 passed |
| Tutorial snapshot and API CSRF checks | Passed |
| Live API concurrency and recovery smoke | Passed |
| Shop SQL verification | 12 offers, stable generation, correct rare prices; writes rolled back |
| Packaged Boot JAR | Includes static frontend and V9/V10; excludes private config and .env |
| Browser tutorial walkthrough | Desktop and 390px phone width; all five effects, completion, replay, and optional motion checked using isolated API fixtures |
| Local database backup | Full restore and six core table counts verified in a disposable database |
| Publication safety scan | Passed against known private values and excluded paths; not a guarantee of detecting every possible secret |

Live smoke checks cover cookie login/logout, CSRF rejection, blocked top-ups, racing daily and quest claims, single crate consumption, shop balance changes and insufficient funds, repeated deals, stale round versions, saved poker and blackjack hands, one-time settlement, the three-box daily cap under concurrency, actual odds, and tutorial persistence. Disposable smoke accounts were removed by exact ID and username. Existing player accounts were not removed.

## Run the updated build

Restart your backend so the new classes and Flyway migrations load. Keep your private local database configuration. The regular development frontend can remain on port 5173 or 5174; both localhost and 127.0.0.1 are allowed by the default development configuration. Use one hostname consistently during a session.

For a release, run these in lootvault-frontend:

```
npm ci
npm run build
npm run lint
```

Then use Java 21 and Maven at the repository root:

```
mvn -Prelease verify
java -jar target/LootVaultProject-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

The production command needs private DB_URL, DB_USERNAME, and DB_PASSWORD values configured on your host. Use HTTPS. Set FRONTEND_ORIGINS only when the browser frontend is served from a separate origin; use exact URLs. Do not copy application-local.properties or .env into the published artifact. No deployment, commit, or push was performed here.

## Human playtest plan

1. Recruit 5-10 adult testers for a staging build with pretend coins and fresh accounts.
2. Give them 20 minutes without guidance: claim rewards, preview The River, finish a hand, buy/open a crate, locate its item, understand a shop price, and refresh an unfinished hand.
3. Record time to first action, mistaken clicks, confusing stakes or payouts, unexpected balances, errors, and where enjoyment drops. Avoid explaining controls until observation ends.
4. Ask them to explain stakes, payouts, folding, rarity odds, and sound/motion controls in their own words.
5. Fix blockers and repeat failed tasks. Proposed acceptance target: 8 of 10 finish the core flow unaided, with zero unexplained balance changes. This target has not yet been measured.

## Deployment verification requiring your access

- Configure the real domain, HTTPS, private environment variables, exact origins, and host monitoring.
- Confirm developer login is unavailable on the production profile, and exercise real-domain cookies, refresh, expiration, logout, and direct navigation.
- Arrange encrypted off-machine backups with scheduled execution and retention. Restore one from that destination; local restoration alone does not prove disaster recovery.
- Start with one backend instance or implement shared sessions. Current in-memory sessions do not survive backend restart; persisted hands do.
- Review media licenses and intended audience before publishing.

## Known follow-up work

Shop and crate purchases still lack a general durable purchase request ID. The client avoids blind network retries, but a user repeating an uncertain purchase can buy a second copy. Add request IDs and receipts before broad launch. Login rate limiting, deployment-specific browser automation, shared sessions if scaling, and off-machine backups also remain.

The economy report gives saving estimates, not observed player retention or guaranteed wagering income. The revised bonuses need playtest feedback. V10 cannot recover items sold before discoveries were recorded. CI is prepared but will run remotely only after you push.

Read understanding-lootvault.md alongside the actual files. It explains the click-to-transaction path, framework boundaries, migration behavior, rendering lifecycle, and exercises for reviewing your own changes.
