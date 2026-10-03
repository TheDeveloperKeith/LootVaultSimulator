package com.example.lootvaultproject.VaultEntity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * Composite primary key for CollectionRewardClaim.
 */
public class CollectionRewardClaimId implements Serializable {

    private UUID playerId;
    private String rarity;

    /**
     * Required by JPA.
     */
    public CollectionRewardClaimId() {
    }

    /**
     * Creates a collection reward claim ID.
     *
     * @param playerId player identifier
     * @param rarity rarity tier
     */
    public CollectionRewardClaimId(UUID playerId, String rarity) {
        this.playerId = playerId;
        this.rarity = rarity;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public String getRarity() {
        return rarity;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (!(obj instanceof CollectionRewardClaimId other)) {
            return false;
        }

        return Objects.equals(playerId, other.playerId)
                && Objects.equals(rarity, other.rarity);
    }

    @Override
    public int hashCode() {
        return Objects.hash(playerId, rarity);
    }
}

