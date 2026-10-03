package com.example.lootvaultproject.VaultDTO;

import java.util.UUID;

public record CraftResponse(
        UUID inventoryItemId,
        UUID itemCatalogId,
        String name,
        String rarity) {
}
