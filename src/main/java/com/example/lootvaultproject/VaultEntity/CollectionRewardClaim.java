package com.example.lootvaultproject.VaultEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents a one-time collection reward claimed by a player
 * for completing a rarity tier.
 */
@Entity
@Table(name = "collection_reward_claims")
@IdClass(CollectionRewardClaimId.class)
public class CollectionRewardClaim {

    @Id
    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Id
    @Column(name = "rarity", nullable = false, length = 40)
    private String rarity;

    @Column(name = "claimed_at", nullable = false)
    private OffsetDateTime claimedAt;

    /**
     * Required by JPA.
     */
    protected CollectionRewardClaim() {
    }

    /**
     * Creates a new collection reward claim.
     *
     * @param playerId player identifier
     * @param rarity rarity tier
     */
    public CollectionRewardClaim(UUID playerId, String rarity) {
        this.playerId = playerId;
        this.rarity = rarity;
        this.claimedAt = OffsetDateTime.now();
    }

    /**
     * Gets the player ID.
     *
     * @return player ID
     */
    public UUID getPlayerId() {
        return playerId;
    }

    /**
     * Gets the rarity.
     *
     * @return rarity
     */
    public String getRarity() {
        return rarity;
    }

    /**
     * Gets when the reward was claimed.
     *
     * @return claim time
     */
    public OffsetDateTime getClaimedAt() {
        return claimedAt;
    }
}

