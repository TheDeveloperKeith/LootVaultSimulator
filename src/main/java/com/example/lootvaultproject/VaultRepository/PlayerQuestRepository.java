package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.PlayerQuest;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for player quests.
 */
public interface PlayerQuestRepository
        extends JpaRepository<PlayerQuest, UUID> {

    /**
     * Finds a quest belonging to a specific player.
     *
     * @param id quest identifier
     * @param playerId player identifier
     * @return matching quest
     */
    Optional<PlayerQuest> findByIdAndPlayerId(
            UUID id,
            UUID playerId);

    /**
     * Finds quests that have not expired.
     *
     * @param playerId player identifier
     * @param now current time
     * @return active quests
     */
    List<PlayerQuest> findByPlayerIdAndExpiresAtAfter(
            UUID playerId,
            OffsetDateTime now);

    /**
     * Checks whether a quest already exists for a player
     * during a specific quest period.
     *
     * @param playerId player identifier
     * @param questCode quest code
     * @param periodStart beginning of period
     * @return true if quest exists
     */
    boolean existsByPlayerIdAndQuestCodeAndPeriodStart(
            UUID playerId,
            String questCode,
            OffsetDateTime periodStart);
}