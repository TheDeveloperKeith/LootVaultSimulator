package com.example.lootvaultproject.VaultDTO;

import java.time.OffsetDateTime;
import java.util.UUID;

public record QuestResponse(
        UUID id,
        String code,
        String title,
        String period,
        int progress,
        int target,
        long rewardCoins,
        boolean completed,
        boolean claimed,
        OffsetDateTime expiresAt) {
}
