package com.example.lootvaultproject.VaultService;

import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.VaultDTO.CollectionResponse;
import com.example.lootvaultproject.VaultEntity.ItemCatalog;
import com.example.lootvaultproject.VaultEntity.PlayerCollection;
import com.example.lootvaultproject.VaultRepository.CollectionRewardClaimRepository;
import com.example.lootvaultproject.VaultRepository.ItemCatalogRepository;
import com.example.lootvaultproject.VaultRepository.PlayerCollectionRepository;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles player collection tracking and collection completion rewards.
 */
@Service
public class CollectionService {

    private static final List<String> RARITIES = List.of(
            "COMMON",
            "BASIC",
            "EXCELLENT",
            "EXOTIC",
            "EXTRAORDINARY",
            "EXTRA_EXTRAORDINARY"
    );

    private static final Map<String, Long> REWARDS = Map.of(
            "COMMON", 100L,
            "BASIC", 200L,
            "EXCELLENT", 300L,
            "EXOTIC", 500L,
            "EXTRAORDINARY", 6000L,
            "EXTRA_EXTRAORDINARY", 15000L
    );

    private final PlayerCollectionRepository collections;
    private final CollectionRewardClaimRepository claims;
    private final ItemCatalogRepository catalog;
    private final WalletService walletService;

    /**
     * Creates the collection service.
     *
     * @param collections player collection repository
     * @param claims collection reward claim repository
     * @param catalog item catalog repository
     * @param walletService wallet service
     */
    public CollectionService(
            PlayerCollectionRepository collections,
            CollectionRewardClaimRepository claims,
            ItemCatalogRepository catalog,
            WalletService walletService) {

        this.collections = collections;
        this.claims = claims;
        this.catalog = catalog;
        this.walletService = walletService;
    }

    /**
     * Records an item discovery for a player.
     *
     * @param playerId player identifier
     * @param item discovered item
     * @return true if this was a new discovery
     */
    @Transactional
    public boolean recordDiscovery(UUID playerId, ItemCatalog item) {
        walletService.lockAccount(playerId);

        if (collections.existsByPlayerIdAndItemCatalog_Id(
                playerId,
                item.getId())) {

            awardTierIfComplete(playerId, item.getRarity());
            return false;
        }

        collections.save(
                new PlayerCollection(playerId, item));

        awardTierIfComplete(
                playerId,
                item.getRarity());

        return true;
    }

    /**
     * Gets the player's collection progress.
     *
     * @param playerId player identifier
     * @return collection progress
     */
    public CollectionResponse get(UUID playerId) {

        List<ItemCatalog> all = catalog.findAll();

        List<PlayerCollection> owned =
                collections.findByPlayerId(playerId);

        Map<String, CollectionResponse.RarityProgress> rarityMap =
                new LinkedHashMap<>();

        for (String rarity : RARITIES) {

            long total = all.stream()
                    .filter(item ->
                            rarity.equals(item.getRarity()))
                    .count();

            long have = owned.stream()
                    .filter(collection ->
                            rarity.equals(
                                    collection
                                            .getItemCatalog()
                                            .getRarity()))
                    .count();

            boolean rewardClaimed =
                    claims.existsByPlayerIdAndRarity(
                            playerId,
                            rarity);

            rarityMap.put(
                    rarity,
                    new CollectionResponse.RarityProgress(
                            have,
                            total,
                            rewardClaimed));
        }

        List<CollectionResponse.CollectedItem> items =
                owned.stream()
                        .map(collection ->
                                new CollectionResponse.CollectedItem(
                                        collection
                                                .getItemCatalog()
                                                .getId(),
                                        collection
                                                .getItemCatalog()
                                                .getName(),
                                        collection
                                                .getItemCatalog()
                                                .getRarity()))
                        .toList();

        return new CollectionResponse(
                owned.size(),
                all.size(),
                rarityMap,
                items);
    }

    /**
     * Awards the rarity completion reward when the player
     * has collected every item in that rarity tier.
     *
     * @param playerId player identifier
     * @param rarity completed rarity
     */
    private void awardTierIfComplete(
            UUID playerId,
            String rarity) {

        long total =
                catalog.findByRarity(rarity).size();

        long collected =
                collections
                        .countByPlayerIdAndItemCatalog_Rarity(
                                playerId,
                                rarity);

        if (total == 0
                || collected < total
                || claims.existsByPlayerIdAndRarity(
                playerId,
                rarity)) {

            return;
        }

        claims.save(
                new com.example.lootvaultproject.VaultEntity
                        .CollectionRewardClaim(
                        playerId,
                        rarity));

        UUID rewardReference =
                createRewardReference(
                        playerId,
                        rarity);

        walletService.creditWithReason(
                playerId,
                CurrencyType.SOFT,
                REWARDS.getOrDefault(
                        rarity,
                        1000L),
                "COLLECTION_REWARD",
                rewardReference);
    }

    /**
     * Creates a stable UUID for the collection reward ledger entry.
     *
     * @param playerId player identifier
     * @param rarity completed rarity
     * @return deterministic reward reference
     */
    private UUID createRewardReference(
            UUID playerId,
            String rarity) {

        String reference =
                "COLLECTION_REWARD:"
                        + playerId
                        + ":"
                        + rarity;

        return UUID.nameUUIDFromBytes(
                reference.getBytes(
                        StandardCharsets.UTF_8));
    }
}
