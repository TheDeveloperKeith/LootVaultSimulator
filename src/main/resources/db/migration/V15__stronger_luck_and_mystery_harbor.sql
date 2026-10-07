-- Preserve potion charges and upgrade existing active boosts.
ALTER TABLE wallets DROP CONSTRAINT wallets_luck_multiplier_check;
ALTER TABLE wallets ALTER COLUMN luck_multiplier TYPE NUMERIC(3,1);
UPDATE wallets SET luck_multiplier = CASE luck_multiplier WHEN 2 THEN 2.5 WHEN 3 THEN 5.5 ELSE luck_multiplier END;
ALTER TABLE wallets ADD CONSTRAINT wallets_luck_multiplier_check CHECK (luck_multiplier IN (1,2.5,5.5));

-- Preserve catalog IDs, owned items, and their existing reveal animation.
UPDATE item_catalog SET name = 'Mystery Harbor' WHERE name = 'Crimson Veil Katana' AND limited = false;
UPDATE shop_offers o SET price_amount = 100000, price_currency = 'SOFT'
FROM item_catalog c WHERE o.item_catalog_id = c.id AND c.name = 'Mystery Harbor';
