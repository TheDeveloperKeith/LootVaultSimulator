package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.PityCounter;
import com.example.lootvaultproject.VaultEntity.PityCounterId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for player pity counters.
 */
public interface PityCounterRepository
        extends JpaRepository<PityCounter, PityCounterId> {

    /**
     * Finds a player's pity counter for a particular pool.
     *
     * @param playerId player identifier
     * @param poolCode crate/banner pool identifier
     * @return pity counter when one exists
     */
    Optional<PityCounter> findByPlayerIdAndPoolCode(
            UUID playerId,
            String poolCode);

    /**
     * Finds all pity counters belonging to a player.
     *
     * @param playerId player identifier
     * @return player's pity counters
     */
    List<PityCounter> findByPlayerId(UUID playerId);
}