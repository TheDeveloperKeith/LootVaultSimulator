package com.example.lootvaultproject.VaultService;

import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.VaultEntity.InventoryCrate;
import com.example.lootvaultproject.VaultEntity.InventoryItem;
import com.example.lootvaultproject.VaultEntity.ItemCatalog;
import com.example.lootvaultproject.VaultEntity.Player;
import com.example.lootvaultproject.VaultRepository.InventoryCrateRepository;
import com.example.lootvaultproject.VaultRepository.InventoryItemRepository;
import com.example.lootvaultproject.VaultRepository.ItemCatalogRepository;
import com.example.lootvaultproject.VaultRepository.PlayerRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Normal Crate Mode: buy a crate with coins, open it later for a
 * weighted-random item, or sell an unopened crate (or a real item) back
 * for coins. This is the CS:GO-style loop the rest of the game economy
 * (shop, unlimited boxes) feeds into and draws from.
 *
 * Crate DEFINITIONS live here as code, not the database — same pattern
 * ShopService uses for prices. Only actual ownership (which crates a
 * player has) is real state, tracked in inventory_crates.
 *
 * Odds below are stored exactly as given, as relative weights rather than
 * numbers forced to sum to 100 — rollRarity() sums whatever's in a
 * crate's map and normalizes against that total, so a crate whose numbers
 * add up to 90 (Basic Crate) or 100.00001 (Excellent Crate) still resolves
 * correctly: the ratios between tiers are preserved exactly as specified,
 * the roll just doesn't waste the shortfall as "nothing."
 */
@Service
public class CrateService {

    public record CrateDefinition(
            String code, String displayName, long priceAmount, CurrencyType priceCurrency,
            long sellValue, Map<String, Double> odds) {}

    private static Map<String, Double> odds(Object... pairs) {
        Map<String, Double> map = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) {
            map.put((String) pairs[i], ((Number) pairs[i + 1]).doubleValue());
        }
        return map;
    }

    public static final Map<String, CrateDefinition> CRATE_DEFINITIONS = new LinkedHashMap<>();
    static {
        CRATE_DEFINITIONS.put("COMMON", new CrateDefinition(
                "COMMON", "Common Crate", 50L, CurrencyType.SOFT, 25L,
                odds("COMMON", 90.0, "BASIC", 9.0, "EXCELLENT", 0.9, "EXTRAORDINARY", 0.1)));

        CRATE_DEFINITIONS.put("BASIC", new CrateDefinition(
                "BASIC", "Basic Crate", 150L, CurrencyType.SOFT, 75L,
                odds("COMMON", 40.0, "BASIC", 40.0, "EXCELLENT", 8.0, "EXTRAORDINARY", 1.9, "EXOTIC", 0.1)));

        CRATE_DEFINITIONS.put("EXCELLENT", new CrateDefinition(
                "EXCELLENT", "Excellent Crate", 400L, CurrencyType.SOFT, 200L,
                odds("BASIC", 15.0, "EXCELLENT", 80.0, "EXTRAORDINARY", 4.9, "EXOTIC", 0.1, "EXTRA_EXTRAORDINARY", 0.00001)));

        CRATE_DEFINITIONS.put("EXTRA_EXTRAORDINARY", new CrateDefinition(
                "EXTRA_EXTRAORDINARY", "ExtraExtraOrdinary Crate", 1000L, CurrencyType.SOFT, 500L,
                odds("EXCELLENT", 40.0, "EXTRAORDINARY", 40.0, "EXOTIC", 9.0, "EXTRA_EXTRAORDINARY", 1.0)));
    }

    // What selling a real (non-crate) item pays out, by its rarity.
    private static final Map<String, Long> ITEM_SELL_VALUE = Map.of(
            "COMMON", 10L,
            "BASIC", 25L,
            "EXCELLENT", 65L,
            "EXOTIC", 130L,
            "EXTRAORDINARY", 260L,
            "EXTRA_EXTRAORDINARY", 2000L
    );

    private final InventoryCrateRepository inventoryCrateRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final ItemCatalogRepository itemCatalogRepository;
    private final PlayerRepository playerRepository;
    private final WalletService walletService;
    private final Random random = new Random();

    public CrateService(
            InventoryCrateRepository inventoryCrateRepository,
            InventoryItemRepository inventoryItemRepository,
            ItemCatalogRepository itemCatalogRepository,
            PlayerRepository playerRepository,
            WalletService walletService) {
        this.inventoryCrateRepository = inventoryCrateRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.itemCatalogRepository = itemCatalogRepository;
        this.playerRepository = playerRepository;
        this.walletService = walletService;
    }

    public List<CrateDefinition> getCrateTypes() {
        return CRATE_DEFINITIONS.values().stream().toList();
    }

    public List<InventoryCrate> getMyCrates(String username) {
        return inventoryCrateRepository.findByPlayerIdOrderByAcquiredAtDesc(playerId(username));
    }

    @Transactional
    public InventoryCrate buyCrate(String username, String crateCode) {
        CrateDefinition def = requireDefinition(crateCode);
        UUID playerId = playerId(username);

        walletService.debit(playerId, def.priceCurrency(), def.priceAmount(), "CRATE_PURCHASE", null);

        return inventoryCrateRepository.save(new InventoryCrate(playerId, def.code(), "CRATE_PURCHASE"));
    }

    /** Opens (consumes) one owned crate and grants a real inventory item rolled from that crate's odds. */
    @Transactional
    public InventoryItem openCrate(String username, UUID inventoryCrateId) {
        UUID playerId = playerId(username);

        InventoryCrate owned = inventoryCrateRepository.findByIdAndPlayerId(inventoryCrateId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Crate not found"));

        CrateDefinition def = requireDefinition(owned.getCrateCode());
        String rolledRarity = rollRarity(def.odds());
        ItemCatalog rolledItem = pickItemOfRarity(rolledRarity);

        inventoryCrateRepository.delete(owned); // the crate is consumed the moment it's opened

        return inventoryItemRepository.save(new InventoryItem(playerId, rolledItem, "CRATE_OPEN"));
    }

    @Transactional
    public void sellCrate(String username, UUID inventoryCrateId) {
        UUID playerId = playerId(username);

        InventoryCrate owned = inventoryCrateRepository.findByIdAndPlayerId(inventoryCrateId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Crate not found"));

        CrateDefinition def = requireDefinition(owned.getCrateCode());
        inventoryCrateRepository.delete(owned);
        walletService.creditWithReason(playerId, def.priceCurrency(), def.sellValue(), "CRATE_SOLD", owned.getId());
    }

    @Transactional
    public void sellItem(String username, UUID inventoryItemId) {
        UUID playerId = playerId(username);

        InventoryItem owned = inventoryItemRepository.findByIdAndPlayerId(inventoryItemId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));

        long value = ITEM_SELL_VALUE.getOrDefault(owned.getItemCatalog().getRarity(), 5L);
        inventoryItemRepository.delete(owned);
        walletService.creditWithReason(playerId, CurrencyType.SOFT, value, "ITEM_SOLD", owned.getId());
    }

    // ---------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------

    private String rollRarity(Map<String, Double> weights) {
        double total = weights.values().stream().mapToDouble(Double::doubleValue).sum();
        double target = random.nextDouble() * total;

        for (Map.Entry<String, Double> entry : weights.entrySet()) {
            target -= entry.getValue();
            if (target <= 0) return entry.getKey();
        }
        return weights.keySet().iterator().next(); // floating-point fallback
    }

    /** Picks a random catalog item of the given rarity, ignoring the active flag — see V4 migration for why. */
    private ItemCatalog pickItemOfRarity(String rarity) {
        List<ItemCatalog> candidates = itemCatalogRepository.findByRarity(rarity);
        if (candidates.isEmpty()) {
            throw new IllegalStateException("No catalog items exist for rarity " + rarity);
        }
        return candidates.get(random.nextInt(candidates.size()));
    }

    private CrateDefinition requireDefinition(String crateCode) {
        CrateDefinition def = CRATE_DEFINITIONS.get(crateCode);
        if (def == null) throw new IllegalArgumentException("Unknown crate type: " + crateCode);
        return def;
    }

    private UUID playerId(String username) {
        return playerRepository.findByUsername(username)
                .map(Player::getId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));
    }
}
