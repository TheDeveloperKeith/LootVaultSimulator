package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.CollectionRewardClaim;
import com.example.lootvaultproject.VaultEntity.CollectionRewardClaimId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for collection rarity completion reward claims.
 */
public interface CollectionRewardClaimRepository
        extends JpaRepository<CollectionRewardClaim,
        CollectionRewardClaimId> {

    /**
     * Checks whether a player has already claimed a reward
     * for the specified rarity.
     *
     * @param playerId player identifier
     * @param rarity rarity tier
     * @return true when already claimed
     */
    boolean existsByPlayerIdAndRarity(
            UUID playerId,
            String rarity);

    /**
     * Finds a specific player's reward claim.
     *
     * @param playerId player identifier
     * @param rarity rarity tier
     * @return matching reward claim
     */
    Optional<CollectionRewardClaim> findByPlayerIdAndRarity(
            UUID playerId,
            String rarity);

    /**
     * Finds all collection rewards claimed by a player.
     *
     * @param playerId player identifier
     * @return player's claims
     */
    List<CollectionRewardClaim> findByPlayerId(UUID playerId);
}