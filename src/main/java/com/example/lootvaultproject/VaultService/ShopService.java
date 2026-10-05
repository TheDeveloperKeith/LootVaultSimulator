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
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Shared weekly collection shop with two curated picks per rarity. */
@Service
public class ShopService {

    private final ShopOfferRepository shopOfferRepository;
    private final ItemCatalogRepository itemCatalogRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final PlayerRepository playerRepository;
    private final WalletService walletService;
    private final CollectionService collections;
    private final QuestService quests;

    public ShopService(
            ShopOfferRepository shopOfferRepository,
            ItemCatalogRepository itemCatalogRepository,
            InventoryItemRepository inventoryItemRepository,
            PlayerRepository playerRepository,
            WalletService walletService, CollectionService collections, QuestService quests) {
        this.shopOfferRepository = shopOfferRepository;
        this.itemCatalogRepository = itemCatalogRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.playerRepository = playerRepository;
        this.walletService = walletService;
        this.collections = collections; this.quests = quests;
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
        shopOfferRepository.ensureWeeklyOffers(weekKey);
        return shopOfferRepository.findByWeekKey(weekKey).stream()
                .sorted(java.util.Comparator.comparingLong(ShopOffer::getPriceAmount)
                    .thenComparing(offer -> offer.getItemCatalog().getName()))
                .map(ShopOfferResult::from).toList();
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

        InventoryItem granted = inventoryItemRepository.save(new InventoryItem(player.getId(), offer.getItemCatalog(), "SHOP_PURCHASE"));
        collections.recordDiscovery(player.getId(), offer.getItemCatalog());
        return granted;
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
