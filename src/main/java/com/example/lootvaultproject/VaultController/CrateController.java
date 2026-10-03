package com.example.lootvaultproject.VaultController;

import com.example.lootvaultproject.VaultDTO.CrateTypeResponse;
import com.example.lootvaultproject.VaultDTO.InventoryCrateResponse;
import com.example.lootvaultproject.VaultDTO.InventoryItemResponse;
import com.example.lootvaultproject.VaultEntity.InventoryCrate;
import com.example.lootvaultproject.VaultEntity.InventoryItem;
import com.example.lootvaultproject.VaultService.CrateService;
import com.example.lootvaultproject.VaultService.CrateService.CrateDefinition;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/crates")
public class CrateController {

    private final CrateService crateService;

    public CrateController(CrateService crateService) {
        this.crateService = crateService;
    }

    @GetMapping("/types")
    public ResponseEntity<List<CrateTypeResponse>> getCrateTypes() {
        List<CrateTypeResponse> body = crateService.getCrateTypes().stream()
                .map(CrateController::toTypeResponse)
                .toList();
        return ResponseEntity.ok(body);
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<InventoryCrateResponse>> getMyCrates(Authentication authentication) {
        List<InventoryCrateResponse> body = crateService.getMyCrates(authentication.getName()).stream()
                .map(CrateController::toInventoryResponse)
                .toList();
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{crateCode}/buy")
    public ResponseEntity<InventoryCrateResponse> buyCrate(@PathVariable String crateCode, Authentication authentication) {
        InventoryCrate crate = crateService.buyCrate(authentication.getName(), crateCode);
        return ResponseEntity.ok(toInventoryResponse(crate));
    }

    @PostMapping("/{inventoryCrateId}/open")
    public ResponseEntity<InventoryItemResponse> openCrate(@PathVariable UUID inventoryCrateId, Authentication authentication) {
        InventoryItem item = crateService.openCrate(authentication.getName(), inventoryCrateId);
        return ResponseEntity.ok(new InventoryItemResponse(
                item.getId(),
                item.getItemCatalog().getName(),
                item.getItemCatalog().getRarity(),
                item.getItemCatalog().getDropRate(),
                item.getAcquiredVia(),
                item.getAcquiredAt()
        ));
    }

    @PostMapping("/{inventoryCrateId}/sell")
    public ResponseEntity<Void> sellCrate(@PathVariable UUID inventoryCrateId, Authentication authentication) {
        crateService.sellCrate(authentication.getName(), inventoryCrateId);
        return ResponseEntity.noContent().build();
    }

    private static CrateTypeResponse toTypeResponse(CrateDefinition def) {
        return new CrateTypeResponse(
                def.code(), def.displayName(), def.priceAmount(),
                def.priceCurrency().name(), def.sellValue(), def.odds());
    }

    private static InventoryCrateResponse toInventoryResponse(InventoryCrate crate) {
        String displayName = CrateService.CRATE_DEFINITIONS.get(crate.getCrateCode()).displayName();
        return new InventoryCrateResponse(crate.getId(), crate.getCrateCode(), displayName, crate.getAcquiredAt());
    }
}