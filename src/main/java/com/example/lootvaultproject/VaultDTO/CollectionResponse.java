package com.example.lootvaultproject.VaultDTO;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record CollectionResponse(
        long collected,
        long total,
        Map<String, RarityProgress> byRarity,
        List<CollectedItem> items) {

    public record RarityProgress(long collected, long total, boolean rewardClaimed) {
    }

    public record CollectedItem(UUID itemCatalogId, String name, String rarity) {
    }
}
