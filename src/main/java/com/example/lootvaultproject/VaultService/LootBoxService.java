package com.example.lootvaultproject.VaultService;

import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.VaultEntity.DailyBoxGrant;
import com.example.lootvaultproject.VaultEntity.InventoryItem;
import com.example.lootvaultproject.VaultEntity.ItemCatalog;
import com.example.lootvaultproject.VaultEntity.Player;
import com.example.lootvaultproject.VaultRepository.DailyBoxGrantRepository;
import com.example.lootvaultproject.VaultRepository.InventoryItemRepository;
import com.example.lootvaultproject.VaultRepository.ItemCatalogRepository;
import com.example.lootvaultproject.VaultRepository.PlayerRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Random;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LootBoxService {

    /** Soft-currency cost of one open in Unlimited Mode (no daily cap, costs currency instead). */
    private static final long UNLIMITED_BOX_COST = 15L;

    private final DailyBoxGrantRepository dailyBoxGrantRepository;
    private final ItemCatalogRepository itemCatalogRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final PlayerRepository playerRepository;
    private final WalletService walletService;
    private final Random random;
    @org.springframework.beans.factory.annotation.Value("${app.game.zone:America/New_York}")
    private String gameZone = "America/New_York";

    public LootBoxService(
            DailyBoxGrantRepository dailyBoxGrantRepository,
            ItemCatalogRepository itemCatalogRepository,
            InventoryItemRepository inventoryItemRepository,
            PlayerRepository playerRepository,
            WalletService walletService) {
        this.dailyBoxGrantRepository = dailyBoxGrantRepository;
        this.itemCatalogRepository = itemCatalogRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.playerRepository = playerRepository;
        this.walletService = walletService;
        this.random = new Random(); // single shared instance — see LootBoxServiceTest for how to inject a seeded one
    }

    @Transactional
    public DailyBoxGrant getOrCreateTodayGrant(String username) {
        Player player = playerRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        LocalDate today = LocalDate.now(java.time.ZoneId.of(gameZone));
        return dailyBoxGrantRepository.findByPlayerIdAndGrantDate(player.getId(), today)
                .orElseGet(() -> dailyBoxGrantRepository.save(new DailyBoxGrant(player.getId(), today, 3, 0)));
    }

    /** The original free daily mode: costs nothing, capped at the day's grant. */
    @Transactional
    public InventoryItem openLootBox(String username) {
        Player player = playerRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        LocalDate today = LocalDate.now(java.time.ZoneId.of(gameZone));

        DailyBoxGrant grant = dailyBoxGrantRepository
                .findByPlayerIdAndGrantDateWithLock(player.getId(), today)
                .orElseGet(() -> dailyBoxGrantRepository.save(new DailyBoxGrant(player.getId(), today, 3, 0)));

        if (grant.getBoxesOpened() >= grant.getBoxesGranted()) {
            throw new IllegalStateException("No box openings remaining for today.");
        }

        ItemCatalog rolledItem = rollWeightedRandomItem();

        InventoryItem inventoryItem = inventoryItemRepository.save(
                new InventoryItem(player.getId(), rolledItem, "GACHA_PULL"));

        grant.setBoxesOpened(grant.getBoxesOpened() + 1); // dirty-checked, flushed on commit

        return inventoryItem;
    }

    /**
     * Unlimited Mode: no daily cap, but each open costs soft currency,
     * debited (with a ledger row) before the roll happens. If the debit
     * fails for insufficient funds, no item is rolled and nothing is
     * written — the whole method is one transaction.
     */
    @Transactional
    public InventoryItem openUnlimitedLootBox(String username) {
        Player player = playerRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        walletService.debit(player.getId(), CurrencyType.SOFT, UNLIMITED_BOX_COST, "GACHA_PULL_PAID", null);

        ItemCatalog rolledItem = rollWeightedRandomItem();

        return inventoryItemRepository.save(
                new InventoryItem(player.getId(), rolledItem, "GACHA_PULL_PAID"));
    }

    public long getUnlimitedBoxCost() {
        return UNLIMITED_BOX_COST;
    }

    public List<InventoryItem> getPlayerInventory(String username) {
        Player player = playerRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));
        return inventoryItemRepository.findByPlayerIdOrderByAcquiredAtDesc(player.getId());
    }

    private ItemCatalog rollWeightedRandomItem() {
        List<ItemCatalog> catalog = itemCatalogRepository.findByIsActiveTrue();
        if (catalog.isEmpty()) {
            throw new IllegalStateException("Item catalog is empty.");
        }

        double totalWeight = catalog.stream().mapToDouble(item -> item.getDropRate().doubleValue()).sum();
        double randomValue = random.nextDouble() * totalWeight;
        double cumulativeWeight = 0.0;

        for (ItemCatalog item : catalog) {
            cumulativeWeight += item.getDropRate().doubleValue();
            if (randomValue <= cumulativeWeight) {
                return item;
            }
        }
        return catalog.get(catalog.size() - 1);
    }
}

