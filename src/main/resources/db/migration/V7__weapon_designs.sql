-- Add original 2D weapon/shield designs. Existing inventory/catalog IDs stay intact.
CREATE TEMP TABLE weapon_pool_totals ON COMMIT DROP AS
SELECT rarity, SUM(drop_rate) AS total FROM item_catalog
WHERE is_active = true AND banner_id IS NULL GROUP BY rarity;

INSERT INTO item_catalog(name,rarity,drop_rate,is_active,banner_id) VALUES
('Brickwood Sword','COMMON',0.00001,true,NULL),
('Studded Saber','COMMON',0.00001,true,NULL),
('Brickwood Shield','COMMON',0.00001,true,NULL),
('Starter Plate Shield','COMMON',0.00001,true,NULL),
('Bluebrick Blade','BASIC',0.00001,true,NULL),
('Steelstep Katana','BASIC',0.00001,true,NULL),
('Bluebrick Shield','BASIC',0.00001,true,NULL),
('Steelstep Guard','BASIC',0.00001,true,NULL),
('Wintermoon Katana','EXCELLENT',0.00001,true,NULL),
('Emberbreath Saber','EXCELLENT',0.00001,true,NULL),
('Wintermoon Shield','EXCELLENT',0.00001,true,NULL),
('Petalstorm Katana','EXOTIC',0.00001,true,NULL),
('Serpentseal Guard','EXOTIC',0.00001,true,NULL),
('Eclipse Cleaver','EXTRAORDINARY',0.00001,true,NULL),
('Dawncrest Saber','EXTRAORDINARY',0.00001,true,NULL),
('Dawncrest Aegis','EXTRAORDINARY',0.00001,true,NULL),
('Crimson Veil Katana','EXTRA_EXTRAORDINARY',0.00001,false,'00000000-0000-0000-0000-000000000099'),
('Voidseal Aegis','EXTRA_EXTRAORDINARY',0.00001,false,'00000000-0000-0000-0000-000000000099');

-- Share each existing rarity budget across its enlarged pool without rounding drift.
WITH pool AS (
 SELECT id,rarity,count(*) OVER(PARTITION BY rarity) AS n,
 row_number() OVER(PARTITION BY rarity ORDER BY id) AS position
 FROM item_catalog WHERE is_active = true AND banner_id IS NULL
), shares AS (
 SELECT p.*,t.total,floor(t.total/p.n*100000)/100000 AS base
 FROM pool p JOIN weapon_pool_totals t USING(rarity)
)
UPDATE item_catalog i SET drop_rate = s.base + CASE WHEN s.position=1 THEN s.total-s.base*s.n ELSE 0 END
FROM shares s WHERE i.id=s.id;

DO $$
BEGIN
 IF EXISTS (
   SELECT 1 FROM weapon_pool_totals t
   WHERE t.total <> (SELECT SUM(i.drop_rate) FROM item_catalog i WHERE i.is_active=true AND i.banner_id IS NULL AND i.rarity=t.rarity)
 ) THEN RAISE EXCEPTION 'Weapon expansion changed an existing rarity budget'; END IF;
END $$;
