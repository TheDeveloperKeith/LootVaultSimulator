-- ============================================================
-- V3: five-tier rarity system + weekly rotating shop
-- ============================================================
-- New tiers (ascending rarity): COMMON (Grey) < BASIC (Blue) <
-- EXCELLENT (Purple) < EXOTIC (Green) < EXTRAORDINARY (Gold/Legendary).
-- Drop-rate targets: COMMON .45 | BASIC .28 | EXCELLENT .15 | EXOTIC .08 | EXTRAORDINARY .04

-- Order matters: drop the old CHECK, remap existing rows, and only then add
-- the new CHECK — adding it first fails because rows still say RARE/EPIC/LEGENDARY.
ALTER TABLE item_catalog DROP CONSTRAINT item_catalog_rarity_check;

-- Remap the V2 seed data onto the new tiers (RARE -> BASIC, EPIC -> EXCELLENT,
-- LEGENDARY -> EXTRAORDINARY) and rebalance so the active pool still sums
-- to 1.0 once the two new EXOTIC items are added below.
UPDATE item_catalog SET drop_rate = 0.11250 WHERE rarity = 'COMMON'; -- 4 x .1125 = .45

UPDATE item_catalog SET rarity = 'BASIC', drop_rate = 0.10000 WHERE name IN ('Steel Broadsword', 'Iron Breastplate');
UPDATE item_catalog SET rarity = 'BASIC', drop_rate = 0.08000 WHERE name = 'Mana Ring'; -- BASIC total .28

UPDATE item_catalog SET rarity = 'EXCELLENT', drop_rate = 0.05000 WHERE rarity = 'EPIC'; -- 3 x .05 = .15

UPDATE item_catalog SET rarity = 'EXTRAORDINARY', drop_rate = 0.02000 WHERE rarity = 'LEGENDARY'; -- 2 x .02 = .04

INSERT INTO item_catalog (name, rarity, drop_rate, is_active) VALUES
    ('Verdant Cloak',  'EXOTIC', 0.04000, true),
    ('Emerald Talon',  'EXOTIC', 0.04000, true); -- EXOTIC total .08

ALTER TABLE item_catalog ADD CONSTRAINT item_catalog_rarity_check
    CHECK (rarity IN ('COMMON', 'BASIC', 'EXCELLENT', 'EXOTIC', 'EXTRAORDINARY'));

-- LootBoxService rolls across every active item, so that's the pool that must sum to 1.0.
DO $$
BEGIN
    IF (SELECT SUM(drop_rate) FROM item_catalog WHERE is_active = true) <> 1.00000 THEN
        RAISE EXCEPTION 'Drop rates for the active item pool must sum to 1.0';
    END IF;
END $$;

-- ============================================================
-- Weekly rotating shop
-- ============================================================
-- Offers are generated lazily by ShopService the first time anyone asks
-- for the shop in a given ISO week (e.g. '2026-W40'), then reused for
-- everyone until the week rolls over. The UNIQUE constraint below is
-- what makes that safe if two requests race to generate the same week.
CREATE TABLE shop_offers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_catalog_id UUID NOT NULL REFERENCES item_catalog(id),
    price_amount    BIGINT NOT NULL CHECK (price_amount > 0),
    price_currency  VARCHAR(10) NOT NULL CHECK (price_currency IN ('SOFT', 'HARD')),
    week_key        VARCHAR(10) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_shop_offer_item_week UNIQUE (item_catalog_id, week_key)
);

CREATE INDEX idx_shop_offers_week ON shop_offers(week_key);
