package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.PlayerCollection;
import com.example.lootvaultproject.VaultEntity.PlayerCollectionId;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for player collection entries.
 */
public interface PlayerCollectionRepository
        extends JpaRepository<PlayerCollection, PlayerCollectionId> {

    /**
     * Checks whether a player has already discovered an item.
     *
     * @param playerId player identifier
     * @param itemCatalogId item catalog identifier
     * @return true if the item is already collected
     */
    boolean existsByPlayerIdAndItemCatalog_Id(
            UUID playerId,
            UUID itemCatalogId);

    /**
     * Finds all collection entries belonging to a player.
     *
     * @param playerId player identifier
     * @return player's collection entries
     */
    List<PlayerCollection> findByPlayerId(
            UUID playerId);

    /**
     * Counts collected items of a particular rarity.
     *
     * @param playerId player identifier
     * @param rarity rarity tier
     * @return number collected
     */
    long countByPlayerIdAndItemCatalog_Rarity(
            UUID playerId,
            String rarity);
}