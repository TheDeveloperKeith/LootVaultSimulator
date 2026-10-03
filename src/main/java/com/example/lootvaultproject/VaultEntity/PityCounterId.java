package com.example.lootvaultproject.VaultEntity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * Composite primary key for PityCounter.
 */
public class PityCounterId implements Serializable {

    private UUID playerId;
    private String poolCode;

    /**
     * Required by JPA.
     */
    public PityCounterId() {
    }

    /**
     * Creates a composite pity counter ID.
     *
     * @param playerId player identifier
     * @param poolCode crate/banner pool identifier
     */
    public PityCounterId(UUID playerId, String poolCode) {
        this.playerId = playerId;
        this.poolCode = poolCode;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public String getPoolCode() {
        return poolCode;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (!(obj instanceof PityCounterId other)) {
            return false;
        }

        return Objects.equals(playerId, other.playerId)
                && Objects.equals(poolCode, other.poolCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(playerId, poolCode);
    }
}
