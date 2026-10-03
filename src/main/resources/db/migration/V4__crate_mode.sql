-- ============================================================
-- V4: Normal Crate Mode
-- ============================================================
-- Adds a sixth, crate-exclusive rarity for the ultra-rare "????" item,
-- and a table to hold crates a player owns but hasn't opened yet.
-- Crate DEFINITIONS (names, prices, per-rarity odds) intentionally live in
-- code (CrateService), the same pattern already used for shop pricing —
-- only actual player-owned STATE needs a table.

ALTER TABLE item_catalog DROP CONSTRAINT item_catalog_rarity_check;
ALTER TABLE item_catalog ADD CONSTRAINT item_catalog_rarity_check
    CHECK (rarity IN ('COMMON', 'BASIC', 'EXCELLENT', 'EXOTIC', 'EXTRAORDINARY', 'EXTRA_EXTRAORDINARY'));

-- The "????" item. Deliberately NOT on the default banner (a separate
-- banner_id) and NOT active, so it can never appear in the normal
-- weighted-random pool used by daily/unlimited loot boxes — the only way
-- to win it is the top-tier crate. Keeping it off the default banner also
-- means it doesn't need to be counted in that banner's sum-to-1.0 check.
INSERT INTO item_catalog (name, rarity, drop_rate, banner_id, is_active) VALUES
    ('???', 'EXTRA_EXTRAORDINARY', 0.00001, '00000000-0000-0000-0000-000000000099', false);

-- One row per unopened crate a player owns. Opening a crate deletes its
-- row here and creates a normal inventory_items row for whatever it
-- rolled — same "consume the crate, keep the prize" model as CS:GO cases.
CREATE TABLE inventory_crates (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    crate_code    VARCHAR(30) NOT NULL, -- matches a key in CrateService.CRATE_DEFINITIONS
    acquired_via  VARCHAR(30) NOT NULL, -- 'CRATE_PURCHASE' for now; room for 'ADMIN_GRANT' etc. later
    acquired_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_crates_player ON inventory_crates(player_id);
