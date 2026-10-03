package com.example.lootvaultproject.VaultDTO;

import java.util.Map;

/**
 * Response DTO describing a crate type available for purchase.
 *
 * @param code crate type code
 * @param displayName crate display name
 * @param priceAmount purchase price
 * @param priceCurrency currency used to purchase the crate
 * @param sellValue value received when selling the crate
 * @param odds rarity odds for the crate
 */
public record CrateTypeResponse(
        String code,
        String displayName,
        long priceAmount,
        String priceCurrency,
        long sellValue,
        Map<String, Double> odds
) {
}