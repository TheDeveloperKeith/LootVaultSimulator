package com.example.lootvaultproject.VaultEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Stores a player's progress toward a daily or weekly quest.
 */
@Entity
@Table(
        name = "player_quests",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {
                        "player_id",
                        "quest_code",
                        "period_start"
                }
        )
)
public class PlayerQuest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Column(name = "quest_code", nullable = false, length = 80)
    private String questCode;

    @Column(name = "quest_period", nullable = false, length = 16)
    private String questPeriod;

    @Column(nullable = false)
    private int progress;

    @Column(nullable = false)
    private int target;

    @Column(name = "reward_coins", nullable = false)
    private long rewardCoins;

    @Column(nullable = false)
    private boolean completed;

    @Column(nullable = false)
    private boolean claimed;

    @Column(name = "period_start", nullable = false)
    private OffsetDateTime periodStart;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    /**
     * Required by JPA.
     */
    protected PlayerQuest() {
    }

    /**
     * Creates a player quest.
     *
     * @param playerId player identifier
     * @param code quest code
     * @param period DAILY or WEEKLY
     * @param target target progress
     * @param rewardCoins coin reward
     * @param periodStart beginning of quest period
     * @param expiresAt quest expiration time
     */
    public PlayerQuest(
            UUID playerId,
            String code,
            String period,
            int target,
            long rewardCoins,
            OffsetDateTime periodStart,
            OffsetDateTime expiresAt) {

        this.playerId = playerId;
        this.questCode = code;
        this.questPeriod = period;
        this.target = target;
        this.rewardCoins = rewardCoins;
        this.periodStart = periodStart;
        this.expiresAt = expiresAt;
        this.progress = 0;
        this.completed = false;
        this.claimed = false;
    }

    public void addProgress(int amount) {
        progress = Math.min(
                target,
                progress + amount);

        completed = progress >= target;
    }

    public void claim() {
        claimed = true;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public String getQuestCode() {
        return questCode;
    }

    public String getQuestPeriod() {
        return questPeriod;
    }

    public int getProgress() {
        return progress;
    }

    public int getTarget() {
        return target;
    }

    public long getRewardCoins() {
        return rewardCoins;
    }

    public boolean isCompleted() {
        return completed;
    }

    public boolean isClaimed() {
        return claimed;
    }

    public OffsetDateTime getPeriodStart() {
        return periodStart;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }
}