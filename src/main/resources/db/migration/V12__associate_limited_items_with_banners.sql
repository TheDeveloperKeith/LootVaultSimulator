ALTER TABLE item_catalog ADD COLUMN limited_banner_code VARCHAR(50) REFERENCES limited_banners(code);
UPDATE item_catalog SET limited_banner_code = 'SKYBOUND'
WHERE limited = true AND name IN ('Sunbreak Oathblade', 'Stormheart Katana', 'Astral Bastion');
