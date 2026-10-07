ALTER TABLE item_catalog ADD COLUMN limited BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE limited_banners (
 code VARCHAR(50) PRIMARY KEY, title VARCHAR(100) NOT NULL,
 starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
 price BIGINT NOT NULL CHECK(price > 0), CHECK(ends_at > starts_at)
);
INSERT INTO limited_banners VALUES ('SKYBOUND','Skybound Oath',now(),now()+interval '14 days',150);
INSERT INTO item_catalog (name,rarity,drop_rate,banner_id,is_active,limited) VALUES
 ('Sunbreak Oathblade','EXTRA_EXTRAORDINARY',0.00333,'00000000-0000-0000-0000-000000000111',false,true),
 ('Stormheart Katana','EXTRA_EXTRAORDINARY',0.00333,'00000000-0000-0000-0000-000000000111',false,true),
 ('Astral Bastion','EXTRA_EXTRAORDINARY',0.00333,'00000000-0000-0000-0000-000000000111',false,true);
CREATE TABLE opening_receipts (
 player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
 request_id UUID NOT NULL, fingerprint TEXT NOT NULL, result TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(player_id,request_id)
);
