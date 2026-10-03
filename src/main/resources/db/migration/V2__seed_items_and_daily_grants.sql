-- Create daily box grants table for UUID-based player IDs
CREATE TABLE daily_box_grants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    grant_date    DATE NOT NULL,
    boxes_granted INT NOT NULL DEFAULT 3,
    boxes_opened  INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_player_grant_date UNIQUE (player_id, grant_date)
);

CREATE INDEX idx_daily_grants_player_date ON daily_box_grants(player_id, grant_date);

-- Seed item_catalog with 12 items across 4 rarities matching precision NUMERIC(6,5)
INSERT INTO item_catalog (name, rarity, drop_rate, is_active) VALUES
    ('Rusty Dagger', 'COMMON', 0.20000, true),
    ('Wooden Shield', 'COMMON', 0.20000, true),
    ('Small Health Potion', 'COMMON', 0.20000, true),
    ('Cloth Boots', 'COMMON', 0.15000, true),
    ('Steel Broadsword', 'RARE', 0.08000, true),
    ('Iron Breastplate', 'RARE', 0.08000, true),
    ('Mana Ring', 'RARE', 0.04000, true),
    ('Shadow Cloak', 'EPIC', 0.02000, true),
    ('Flame Wand', 'EPIC', 0.01500, true),
    ('Thunder Hammer', 'EPIC', 0.01000, true),
    ('Excalibur', 'LEGENDARY', 0.00300, true),
    ('Aegis of the Immortal', 'LEGENDARY', 0.00200, true);