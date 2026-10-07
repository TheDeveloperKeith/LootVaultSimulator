-- Gems use the existing HARD wallet currency and ledger; no parallel balance.
ALTER TABLE wallets ADD COLUMN luck_multiplier INT NOT NULL DEFAULT 1 CHECK (luck_multiplier IN (1,2,3));
ALTER TABLE wallets ADD COLUMN luck_rolls INT NOT NULL DEFAULT 0 CHECK (luck_rolls BETWEEN 0 AND 10);
ALTER TABLE wallets ADD CONSTRAINT wallet_luck_consistent CHECK ((luck_rolls=0 AND luck_multiplier=1) OR (luck_rolls>0 AND luck_multiplier>1));
CREATE TABLE daily_gem_claims (
 player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
 claim_date DATE NOT NULL, PRIMARY KEY(player_id,claim_date)
);
CREATE TABLE gem_receipts (
 player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
 request_id UUID NOT NULL, fingerprint TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(player_id,request_id)
);
ALTER TABLE earn_rounds ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'SOFT' CHECK (currency IN ('SOFT','HARD'));
