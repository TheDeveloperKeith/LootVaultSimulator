package com.example.lootvaultproject.VaultController;

import com.example.lootvaultproject.VaultDTO.InventoryItemResponse;
import com.example.lootvaultproject.VaultService.CrateService;
import com.example.lootvaultproject.VaultService.LootBoxService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final LootBoxService lootBoxService;
    private final CrateService crateService;

    public InventoryController(
            LootBoxService lootBoxService,
            CrateService crateService) {
        this.lootBoxService = lootBoxService;
        this.crateService = crateService;
    }

    @GetMapping
    public ResponseEntity<List<InventoryItemResponse>> getInventory(
            Authentication authentication) {

        List<InventoryItemResponse> inventory =
                lootBoxService.getPlayerInventory(authentication.getName())
                        .stream()
                        .map(item -> new InventoryItemResponse(
                                item.getId(),
                                item.getItemCatalog().getName(),
                                item.getItemCatalog().getRarity(),
                                item.getItemCatalog().getDropRate(),
                                item.getAcquiredVia(),
                                item.getAcquiredAt()
                        ))
                        .toList();

        return ResponseEntity.ok(inventory);
    }

    @PostMapping("/{inventoryItemId}/sell")
    public ResponseEntity<Void> sellItem(
            @PathVariable UUID inventoryItemId,
            Authentication authentication) {

        crateService.sellItem(
                authentication.getName(),
                inventoryItemId
        );

        return ResponseEntity.noContent().build();
    }
}