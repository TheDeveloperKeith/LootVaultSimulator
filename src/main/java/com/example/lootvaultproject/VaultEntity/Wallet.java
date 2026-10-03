package com.example.lootvaultproject.VaultEntity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "player_id", nullable = false, unique = true)
    private UUID playerId;

    @Column(name = "soft_balance", nullable = false)
    private Long softBalance = 0L;

    @Column(name = "hard_balance", nullable = false)
    private Long hardBalance = 0L;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    public Wallet() {}

    public Wallet(UUID playerId, Long softBalance, Long hardBalance) {
        this.playerId = playerId;
        this.softBalance = softBalance;
        this.hardBalance = hardBalance;
    }

    public void creditSoft(Long amount) {
        this.softBalance += amount;
    }

    public void creditHard(Long amount) {
        this.hardBalance += amount;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public UUID getPlayerId() { return playerId; }
    public void setPlayerId(UUID playerId) { this.playerId = playerId; }
    public Long getSoftBalance() { return softBalance; }
    public void setSoftBalance(Long softBalance) { this.softBalance = softBalance; }
    public Long getHardBalance() { return hardBalance; }
    public void setHardBalance(Long hardBalance) { this.hardBalance = hardBalance; }
    public Long getVersion() { return version; }
}