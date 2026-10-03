package com.example.lootvaultproject.VaultController;

import com.example.lootvaultproject.VaultDTO.DailyGrantResponse;
import com.example.lootvaultproject.VaultDTO.InventoryItemResponse;
import com.example.lootvaultproject.VaultEntity.DailyBoxGrant;
import com.example.lootvaultproject.VaultEntity.InventoryItem;
import com.example.lootvaultproject.VaultService.LootBoxService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lootboxes")
public class LootBoxController {

    private final LootBoxService lootBoxService;

    public LootBoxController(LootBoxService lootBoxService) {
        this.lootBoxService = lootBoxService;
    }

    @GetMapping
    public ResponseEntity<DailyGrantResponse> getTodayGrant(Authentication authentication) {
        DailyBoxGrant grant = lootBoxService.getOrCreateTodayGrant(authentication.getName());
        int remaining = grant.getBoxesGranted() - grant.getBoxesOpened();
        return ResponseEntity.ok(new DailyGrantResponse(
                grant.getBoxesGranted(),
                grant.getBoxesOpened(),
                remaining
        ));
    }

    @PostMapping("/open")
    public ResponseEntity<InventoryItemResponse> openLootBox(Authentication authentication) {
        InventoryItem item = lootBoxService.openLootBox(authentication.getName());
        return ResponseEntity.ok(new InventoryItemResponse(
                item.getId(),
                item.getItemCatalog().getName(),
                item.getItemCatalog().getRarity(),
                item.getItemCatalog().getDropRate(),
                item.getAcquiredVia(),
                item.getAcquiredAt()
        ));
    }
}