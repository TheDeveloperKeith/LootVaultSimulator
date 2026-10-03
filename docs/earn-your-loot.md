# Earn your loot

The card tables are available at `/earn`, linked from the lobby, navigation, modes, and progression pages. Open the daily coin crate for 500 soft coins alongside the existing three daily lootboxes. Claims reset at midnight America/New_York, shared with daily lootbox and quest dates.

## Game rules

Entry costs between 10% (rounded up) and 100% of the player's current soft balance. One saved hand can be active per player. Stakes are deducted immediately; results display gross returns and net coins separately. All-in losses can be recovered with the next daily crate or inventory sales.

Jack No Black uses blackjack against a dealer who stands on all 17s. Aces count as 1 or 11. Wins return twice the stake; natural blackjack returns 2.5 times the stake, rounded down; pushes return the stake. Splits, doubles, and insurance are absent.

The River is a fast Hold'em variant against Nova and Atlas. All three seats ante the entry stake. Each receives two hole cards, and the table starts with a three-card flop. Check or raise on the flop, turn, and river; AI opponents call or fold raises using their own cards and the visible board. This variant has no blinds or AI raises. Best five-card poker hand wins, with tied pots split. Opponent cards remain hidden until completion. AI opponents use virtual table coins.

Tension effects reflect blackjack totals or Hold'em street progression, rather than computed winning odds. Victory and loss have separate visual feedback; reduced-motion preferences are respected.

## Persistence and progression

Flyway migration V6 adds daily claim and saved-round tables. Restart the backend to apply it before using the feature. Existing wallets, inventory, and quests are preserved.

New daily quests reward claiming the coin crate, finishing three hands, and winning blackjack. Weekly quests reward three River wins and fifteen finished hands. Old quests remain available.

Coin claims, stakes, raises, payouts, and quest events execute transactionally. Wallet row locks serialize card actions and quest claims. Unique daily claims and start request IDs prevent duplicate claims and start charges. Actions include a round version; stale actions are rejected. Completed hands return their existing result without paying again.

Optional backend configuration:

```properties
app.earn.daily-coins=500
app.game.zone=America/New_York
```

API: authenticated GET `/api/earn`; POST `/api/earn/daily/claim`; POST `/api/earn/rounds` with `{requestId, game, stake}`; POST `/api/earn/rounds/{id}/actions` with `{version, action, raiseAmount}`. Game values are BLACKJACK and HOLDEM.

Verification: 19 JUnit rule tests cover blackjack settlement, aces, dealer rules, poker rankings, tie splits, raise accounting, dealing, invalid moves, and saved-state serialization. Frontend build and changed-file ESLint checks pass. Browser preview used isolated sample data, verified claim/start/result controls, and checked the 390px layout for horizontal overflow. Live database/API integration has not been exercised.
