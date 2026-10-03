package com.example.lootvaultproject.VaultDTO;

import java.util.UUID;

public class WalletResponse {

    private final UUID walletId;
    private final UUID playerId;
    private final Long softBalance;
    private final Long hardBalance;

    public WalletResponse(UUID walletId, UUID playerId, Long softBalance, Long hardBalance) {
        this.walletId = walletId;
        this.playerId = playerId;
        this.softBalance = softBalance;
        this.hardBalance = hardBalance;
    }

    public UUID getWalletId() { return walletId; }
    public UUID getPlayerId() { return playerId; }
    public Long getSoftBalance() { return softBalance; }
    public Long getHardBalance() { return hardBalance; }
}
