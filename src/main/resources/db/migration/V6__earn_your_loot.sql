CREATE TABLE daily_coin_claims (
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    claim_date DATE NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (player_id, claim_date)
);

CREATE TABLE earn_rounds (
    id UUID PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    game VARCHAR(20) NOT NULL CHECK (game IN ('BLACKJACK', 'HOLDEM')),
    status VARCHAR(16) NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETE')),
    state TEXT NOT NULL,
    coins_committed BIGINT NOT NULL CHECK (coins_committed > 0),
    payout BIGINT NOT NULL DEFAULT 0 CHECK (payout >= 0),
    outcome VARCHAR(16),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_earn_one_active_round ON earn_rounds(player_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_earn_player_history ON earn_rounds(player_id, created_at DESC);
