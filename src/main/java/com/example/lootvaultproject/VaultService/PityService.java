package com.example.lootvaultproject.VaultService;

import com.example.lootvaultproject.VaultDTO.PityResponse;
import com.example.lootvaultproject.VaultEntity.PityCounter;
import com.example.lootvaultproject.VaultRepository.PityCounterRepository;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles crate pity progression.
 *
 * A player is guaranteed an Extraordinary item on pull 50
 * if they have not already received Extraordinary or better.
 */
@Service
public class PityService {

    public static final int GUARANTEE_AT = 50;

    private final PityCounterRepository repository;

    /**
     * Creates the pity service.
     *
     * @param repository pity counter repository
     */
    public PityService(PityCounterRepository repository) {
        this.repository = repository;
    }

    /**
     * Determines whether the player's next pull should be forced
     * to Extraordinary.
     *
     * @param playerId player ID
     * @param poolCode crate/pool code
     * @return true if pity should activate
     */
    public boolean shouldForce(UUID playerId, String poolCode) {

        return repository
                .findByPlayerIdAndPoolCode(playerId, poolCode)
                .map(counter ->
                        counter.getPullsSinceExtraordinary()
                                >= GUARANTEE_AT - 1)
                .orElse(false);
    }

    /**
     * Records the result of a crate pull.
     *
     * @param playerId player ID
     * @param poolCode crate/pool code
     * @param rarity rolled rarity
     */
    @Transactional
    public void recordPull(
            UUID playerId,
            String poolCode,
            String rarity) {

        PityCounter counter = repository
                .findByPlayerIdAndPoolCode(playerId, poolCode)
                .orElse(null);

        if (counter == null) {
            counter = new PityCounter(playerId, poolCode);
        }

        if (isExtraordinaryOrBetter(rarity)) {
            counter.hit();
        } else {
            counter.miss();
        }

        repository.save(counter);
    }

    /**
     * Returns all pity counters belonging to a player.
     *
     * @param playerId player ID
     * @return pity information
     */
    public List<PityResponse> get(UUID playerId) {

        return repository.findByPlayerId(playerId)
                .stream()
                .map(counter -> new PityResponse(
                        counter.getPoolCode(),
                        counter.getPullsSinceExtraordinary(),
                        GUARANTEE_AT,
                        counter.getTotalPulls()))
                .toList();
    }

    /**
     * Determines whether a rarity resets pity.
     *
     * @param rarity item rarity
     * @return true for Extraordinary or better
     */
    private boolean isExtraordinaryOrBetter(String rarity) {

        return "EXTRAORDINARY".equals(rarity)
                || "EXOTIC".equals(rarity)
                || "EXTRA_EXTRAORDINARY".equals(rarity);
    }
}
