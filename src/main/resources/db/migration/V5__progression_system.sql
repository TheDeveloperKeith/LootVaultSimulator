CREATE TABLE player_collection (
    player_id UUID NOT NULL,
    item_catalog_id UUID NOT NULL,
    first_obtained_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_player_collection
        PRIMARY KEY (player_id, item_catalog_id),

    CONSTRAINT fk_collection_player
        FOREIGN KEY (player_id)
        REFERENCES players(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_collection_item
        FOREIGN KEY (item_catalog_id)
        REFERENCES item_catalog(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_player_collection_player
    ON player_collection(player_id);


-- ============================================================
-- COLLECTION TIER REWARDS
--
-- Prevents a player from repeatedly claiming the reward for
-- completing the same rarity.
-- ============================================================

CREATE TABLE collection_reward_claims (
    player_id UUID NOT NULL,
    rarity VARCHAR(40) NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_collection_reward_claim
        PRIMARY KEY (player_id, rarity),

    CONSTRAINT fk_collection_reward_player
        FOREIGN KEY (player_id)
        REFERENCES players(id)
        ON DELETE CASCADE
);


-- ============================================================
-- QUEST PROGRESS
--
-- Quest definitions live in Java.
-- This table stores only player-specific progress.
-- ============================================================

CREATE TABLE player_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    player_id UUID NOT NULL,

    quest_code VARCHAR(80) NOT NULL,

    quest_period VARCHAR(16) NOT NULL,

    progress INTEGER NOT NULL DEFAULT 0,

    target INTEGER NOT NULL,

    reward_coins BIGINT NOT NULL,

    completed BOOLEAN NOT NULL DEFAULT FALSE,

    claimed BOOLEAN NOT NULL DEFAULT FALSE,

    period_start TIMESTAMPTZ NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_player_quest_player
        FOREIGN KEY (player_id)
        REFERENCES players(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_player_quest_period
        UNIQUE (player_id, quest_code, period_start),

    CONSTRAINT chk_quest_progress
        CHECK (progress >= 0),

    CONSTRAINT chk_quest_target
        CHECK (target > 0),

    CONSTRAINT chk_quest_reward
        CHECK (reward_coins >= 0),

    CONSTRAINT chk_quest_period
        CHECK (quest_period IN ('DAILY', 'WEEKLY'))
);

CREATE INDEX idx_player_quests_active
    ON player_quests(player_id, expires_at);


-- ============================================================
-- PITY COUNTERS
--
-- One counter per player + banner/crate pool.
-- ============================================================

CREATE TABLE pity_counters (
    player_id UUID NOT NULL,

    pool_code VARCHAR(80) NOT NULL,

    pulls_since_extraordinary INTEGER NOT NULL DEFAULT 0,

    total_pulls BIGINT NOT NULL DEFAULT 0,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_pity_counter
        PRIMARY KEY (player_id, pool_code),

    CONSTRAINT fk_pity_player
        FOREIGN KEY (player_id)
        REFERENCES players(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_pity_nonnegative
        CHECK (pulls_since_extraordinary >= 0),

    CONSTRAINT chk_total_pulls_nonnegative
        CHECK (total_pulls >= 0)
);

