-- ============================================================
-- LootVault — Full PostgreSQL Schema
-- ============================================================
-- Organized by domain: identity/wallet, gacha, marketplace/escrow.
-- Every table has a one-line comment explaining WHY it exists,
-- not just what columns it has — that's the part interviewers
-- actually probe.


-- ============================================================
-- DOMAIN 1: Identity & Wallet
-- ============================================================

CREATE TABLE players (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50) NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cached, denormalized balance. Source of truth is ledger_entries below —
-- this table exists purely so "what's my balance" is an O(1) indexed
-- lookup instead of SUM()-ing the whole ledger on every read.
CREATE TABLE wallets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id    UUID NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
    soft_balance BIGINT NOT NULL DEFAULT 0 CHECK (soft_balance >= 0),
    hard_balance BIGINT NOT NULL DEFAULT 0 CHECK (hard_balance >= 0),
    version      BIGINT NOT NULL DEFAULT 0   -- backs JPA @Version (optimistic locking)
);

-- Append-only, immutable audit log. Never UPDATE or DELETE a row here —
-- every balance change gets a new row. This is what makes the wallet
-- balance provably correct: you can always replay the ledger and recompute it.
CREATE TABLE ledger_entries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id     UUID NOT NULL REFERENCES wallets(id),
    currency      VARCHAR(10) NOT NULL CHECK (currency IN ('SOFT', 'HARD')),
    amount        BIGINT NOT NULL,               -- signed: +500 credit, -100 debit
    balance_after BIGINT NOT NULL,
    entry_type    VARCHAR(30) NOT NULL,           -- 'TOPUP', 'GACHA_PULL', 'MARKET_SALE', 'MARKET_PURCHASE', ...
    ref_id        UUID,                            -- optional FK-ish pointer to the pull/trade/escrow row that caused this
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_wallet_id      ON ledger_entries(wallet_id);
CREATE INDEX idx_ledger_wallet_created ON ledger_entries(wallet_id, created_at DESC);


-- ============================================================
-- DOMAIN 2: Gacha
-- ============================================================

-- The static catalog of everything that CAN be won. Rarity + drop_rate
-- live here, not hardcoded in Java, so game designers can rebalance
-- odds without a redeploy.
CREATE TABLE item_catalog (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    rarity      VARCHAR(20) NOT NULL CHECK (rarity IN ('COMMON', 'RARE', 'EPIC', 'LEGENDARY')),
    drop_rate   NUMERIC(6,5) NOT NULL CHECK (drop_rate > 0 AND drop_rate <= 1), -- e.g. 0.00600 = 0.6%
    banner_id   UUID,             -- which gacha "banner"/pool this item belongs to
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_item_catalog_banner ON item_catalog(banner_id) WHERE is_active = true;

-- One row per (player, banner). Tracks pulls-since-last-rare so the
-- service layer can enforce "guaranteed epic by pull 90" pity logic.
-- This table gets read-then-written on EVERY pull, so it's a hot row —
-- worth mentioning row-level locking here in an interview.
CREATE TABLE pity_counters (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    banner_id         UUID NOT NULL,
    pulls_since_rare  INT NOT NULL DEFAULT 0,
    pulls_since_epic  INT NOT NULL DEFAULT 0,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (player_id, banner_id)
);

-- What a player actually owns. Modeled as one row per unit (not a
-- quantity column) so each pulled item can carry its own metadata
-- later (e.g. a unique skin roll, trade lock, serial number) without
-- a schema change — a common "why didn't you just use quantity?" question.
CREATE TABLE inventory_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_catalog_id UUID NOT NULL REFERENCES item_catalog(id),
    acquired_via    VARCHAR(30) NOT NULL,   -- 'GACHA_PULL', 'MARKET_PURCHASE', 'ADMIN_GRANT'
    is_listed       BOOLEAN NOT NULL DEFAULT false,  -- true while on the marketplace (prevents double-sell)
    acquired_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_player ON inventory_items(player_id);

-- One row per pull, independent of the ledger entry. Useful for
-- "show my pull history" UI and for auditing pity-timer correctness
-- without reconstructing it from the ledger's generic entry_type rows.
CREATE TABLE gacha_pulls (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    banner_id       UUID NOT NULL,
    item_catalog_id UUID NOT NULL REFERENCES item_catalog(id),
    cost_currency   VARCHAR(10) NOT NULL CHECK (cost_currency IN ('SOFT', 'HARD')),
    cost_amount     BIGINT NOT NULL,
    was_pity_trigger BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gacha_pulls_player ON gacha_pulls(player_id, created_at DESC);


-- ============================================================
-- DOMAIN 3: Marketplace & Escrow
-- ============================================================

-- A seller's offer. Kept separate from escrow_transactions because a
-- listing can exist for a long time with zero buyers — it's a
-- different lifecycle than a trade in progress.
CREATE TABLE listings (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id          UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    inventory_item_id  UUID NOT NULL UNIQUE REFERENCES inventory_items(id),
    price_amount       BIGINT NOT NULL CHECK (price_amount > 0),
    price_currency     VARCHAR(10) NOT NULL CHECK (price_currency IN ('SOFT', 'HARD')),
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                         CHECK (status IN ('ACTIVE', 'SOLD', 'CANCELLED')),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_status_price ON listings(status, price_amount) WHERE status = 'ACTIVE';

-- The actual buy flow. Modeled as its own table (not just two ledger
-- rows) because a trade has a lifecycle with failure states —
-- PENDING while both wallet ops run, COMPLETED once atomic, FAILED
-- if something rolled back. This is your audit trail for "what
-- happened to my purchase?" support tickets.
CREATE TABLE escrow_transactions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id         UUID NOT NULL REFERENCES listings(id),
    buyer_id           UUID NOT NULL REFERENCES players(id),
    seller_id          UUID NOT NULL REFERENCES players(id),
    amount             BIGINT NOT NULL CHECK (amount > 0),
    currency           VARCHAR(10) NOT NULL CHECK (currency IN ('SOFT', 'HARD')),
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                         CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at       TIMESTAMPTZ
);

CREATE INDEX idx_escrow_buyer  ON escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_seller ON escrow_transactions(seller_id);

-- Foreign-key note: buyer_id and seller_id are BOTH FKs to players(id).
-- When locking both wallets in the same trade, always acquire them in
-- a consistent order (e.g. ORDER BY wallets.id) to avoid deadlocks
-- between two concurrent opposite-direction trades.
