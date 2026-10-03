package com.example.lootvaultproject.VaultDTO;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record InventoryItemResponse(
        UUID id,
        String itemName,
        String rarity,
        BigDecimal dropRate,
        String acquiredVia,
        OffsetDateTime acquiredAt
) {}