package com.example.lootvaultproject.VaultDTO;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Response DTO representing an unopened crate owned by a player.
 *
 * @param id unique inventory crate ID
 * @param crateCode crate type code
 * @param crateDisplayName display name of the crate
 * @param acquiredAt time the crate was acquired
 */
public record InventoryCrateResponse(
        UUID id,
        String crateCode,
        String crateDisplayName,
        OffsetDateTime acquiredAt
) {
}
