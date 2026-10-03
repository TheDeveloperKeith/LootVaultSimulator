package com.example.lootvaultproject.VaultService;

import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.VaultEntity.InventoryItem;
import com.example.lootvaultproject.VaultEntity.ItemCatalog;
import com.example.lootvaultproject.VaultEntity.Player;
import com.example.lootvaultproject.VaultEntity.ShopOffer;
import com.example.lootvaultproject.VaultRepository.InventoryItemRepository;
import com.example.lootvaultproject.VaultRepository.ItemCatalogRepository;
import com.example.lootvaultproject.VaultRepository.PlayerRepository;
import com.example.lootvaultproject.VaultRepository.ShopOfferRepository;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Weekly rotating shop. Offers are NOT placeholders and are not written by
 * hand: the first request in a given ISO week generates real rows (one
 * random active item per rarity tier, priced by rarity) and stores them, so
 * every player sees the same six offers until the week rolls over — at
 * which point the next request generates a fresh set automatically. No
 * cron job or scheduled task is needed; the rotation is driven by the
 * week's own identity.
 */
@Service
public class ShopService {

    // Soft-currency price per rarity tier. Tune freely — this is game
    // balance, not a system constraint.
    private static final Map<String, Long> PRICE_BY_RARITY = Map.of(
            "COMMON", 25L,
            "BASIC", 60L,
            "EXCELLENT", 150L,
            "EXOTIC", 300L,
            "EXTRAORDINARY", 600L
    );

    private final ShopOfferRepository shopOfferRepository;
    private final ItemCatalogRepository itemCatalogRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final PlayerRepository playerRepository;
    private final WalletService walletService;

    public ShopService(
            ShopOfferRepository shopOfferRepository,
            ItemCatalogRepository itemCatalogRepository,
            InventoryItemRepository inventoryItemRepository,
            PlayerRepository playerRepository,
            WalletService walletService) {
        this.shopOfferRepository = shopOfferRepository;
        this.itemCatalogRepository = itemCatalogRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.playerRepository = playerRepository;
        this.walletService = walletService;
    }

    /** ISO week identity, e.g. "2026-W40". Two requests in the same week always get this same key. */
    public static String currentWeekKey() {
        LocalDate today = LocalDate.now();
        WeekFields iso = WeekFields.ISO;
        int week = today.get(iso.weekOfWeekBasedYear());
        int weekYear = today.get(iso.weekBasedYear());
        return String.format(Locale.ROOT, "%d-W%02d", weekYear, week);
    }

    @Transactional
    public List<ShopOfferResult> getCurrentOffers() {
        String weekKey = currentWeekKey();
        List<ShopOffer> offers = shopOfferRepository.findByWeekKey(weekKey);

        if (offers.isEmpty()) {
            offers = generateOffersForWeek(weekKey);
        }

        return offers.stream().map(ShopOfferResult::from).toList();
    }

    /**
     * Picks one random ACTIVE item per rarity tier that exists in the
     * catalog and prices it by tier. The random seed is derived from the
     * week key, so regenerating the same week (e.g. a retried request)
     * reliably reaches the same rotation instead of drifting.
     */
    private List<ShopOffer> generateOffersForWeek(String weekKey) {
        List<ItemCatalog> active = itemCatalogRepository.findByIsActiveTrue();

        Map<String, List<ItemCatalog>> byRarity = active.stream()
                .collect(Collectors.groupingBy(ItemCatalog::getRarity, LinkedHashMap::new, Collectors.toList()));

        Random rng = new Random(weekKey.hashCode());
        List<ShopOffer> toSave = new ArrayList<>();

        for (Map.Entry<String, List<ItemCatalog>> entry : byRarity.entrySet()) {
            List<ItemCatalog> candidates = entry.getValue();
            if (candidates.isEmpty()) continue;

            ItemCatalog chosen = candidates.get(rng.nextInt(candidates.size()));
            long price = PRICE_BY_RARITY.getOrDefault(entry.getKey(), 100L);
            toSave.add(new ShopOffer(chosen, price, CurrencyType.SOFT, weekKey));
        }

        try {
            return shopOfferRepository.saveAll(toSave);
        } catch (DataIntegrityViolationException raceLost) {
            // Another request generated this week's offers first — read what they wrote.
            return shopOfferRepository.findByWeekKey(weekKey);
        }
    }

    @Transactional
    public InventoryItem buyOffer(String username, java.util.UUID offerId) {
        Player player = playerRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        ShopOffer offer = shopOfferRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        if (!offer.getWeekKey().equals(currentWeekKey())) {
            throw new IllegalStateException("This offer is no longer in this week's shop.");
        }

        walletService.debit(player.getId(), offer.getPriceCurrency(), offer.getPriceAmount(), "SHOP_PURCHASE", offer.getId());

        return inventoryItemRepository.save(
                new InventoryItem(player.getId(), offer.getItemCatalog(), "SHOP_PURCHASE"));
    }

    /** Plain carrier so the controller doesn't need to touch the entity directly. */
    public record ShopOfferResult(
            java.util.UUID id, String itemName, String rarity,
            long priceAmount, String priceCurrency, String weekKey) {

        static ShopOfferResult from(ShopOffer offer) {
            return new ShopOfferResult(
                    offer.getId(),
                    offer.getItemCatalog().getName(),
                    offer.getItemCatalog().getRarity(),
                    offer.getPriceAmount(),
                    offer.getPriceCurrency().name(),
                    offer.getWeekKey()
            );
        }
    }
}
