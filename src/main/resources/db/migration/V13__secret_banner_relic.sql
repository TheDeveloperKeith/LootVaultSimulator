ALTER TABLE item_catalog ADD COLUMN secret BOOLEAN NOT NULL DEFAULT false;
INSERT INTO item_catalog (name,rarity,drop_rate,banner_id,is_active,limited,limited_banner_code,secret) VALUES
 ('Eclipse of Tomorrow','EXTRA_EXTRAORDINARY',0.00010,'00000000-0000-0000-0000-000000000111',false,true,'SKYBOUND',true);
