package com.example.lootvaultproject.VaultDTO;

import java.util.UUID;

public record ShopOfferResponse(
        UUID id,
        String itemName,
        String rarity,
        long priceAmount,
        String priceCurrency,
        String weekKey
) {}
