package com.example.lootvaultproject.VaultEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Stores pity progress for a player's crate/banner pool.
 *
 * The database uses player_id + pool_code as a composite primary key.
 */
@Entity
@Table(name = "pity_counters")
@IdClass(PityCounterId.class)
public class PityCounter {

    @Id
    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Id
    @Column(name = "pool_code", nullable = false, length = 80)
    private String poolCode;

    @Column(name = "pulls_since_extraordinary", nullable = false)
    private int pullsSinceExtraordinary;

    @Column(name = "total_pulls", nullable = false)
    private long totalPulls;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /**
     * Required by JPA.
     */
    protected PityCounter() {
    }

    /**
     * Creates a new pity counter for a player and pool.
     *
     * @param playerId player identifier
     * @param poolCode crate/banner pool identifier
     */
    public PityCounter(UUID playerId, String poolCode) {
        this.playerId = playerId;
        this.poolCode = poolCode;
        this.pullsSinceExtraordinary = 0;
        this.totalPulls = 0;
        this.updatedAt = OffsetDateTime.now();
    }

    /**
     * Records a pull that did not receive Extraordinary or better.
     */
    public void miss() {
        pullsSinceExtraordinary++;
        totalPulls++;
        updatedAt = OffsetDateTime.now();
    }

    /**
     * Records an Extraordinary-or-better pull.
     *
     * Pity resets to zero.
     */
    public void hit() {
        pullsSinceExtraordinary = 0;
        totalPulls++;
        updatedAt = OffsetDateTime.now();
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public String getPoolCode() {
        return poolCode;
    }

    public int getPullsSinceExtraordinary() {
        return pullsSinceExtraordinary;
    }

    public long getTotalPulls() {
        return totalPulls;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}