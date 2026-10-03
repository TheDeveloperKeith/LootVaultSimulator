package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.InventoryCrate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for accessing player-owned unopened crates.
 *
 * @author Keith Purvis Jr.
 * @version Sep 30, 2026
 */
public interface InventoryCrateRepository
        extends JpaRepository<InventoryCrate, UUID> {

    /**
     * Finds all unopened crates owned by a player,
     * ordered from newest to oldest.
     *
     * @param playerId the player's unique ID
     * @return the player's unopened crates
     */
    List<InventoryCrate> findByPlayerIdOrderByAcquiredAtDesc(UUID playerId);

    /**
     * Finds a specific crate only if it belongs to the given player.
     *
     * @param id the crate's unique ID
     * @param playerId the player's unique ID
     * @return the crate if it exists and belongs to the player
     */
    Optional<InventoryCrate> findByIdAndPlayerId(
            UUID id, UUID playerId);
}