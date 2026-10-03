package com.example.lootvaultproject.VaultController;

import com.example.lootvaultproject.VaultDTO.InventoryItemResponse;
import com.example.lootvaultproject.VaultDTO.ShopOfferResponse;
import com.example.lootvaultproject.VaultEntity.InventoryItem;
import com.example.lootvaultproject.VaultService.ShopService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shop")
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    /** Public: anyone can browse this week's shop without logging in. */
    @GetMapping("/offers")
    public ResponseEntity<List<ShopOfferResponse>> getOffers() {
        List<ShopOfferResponse> body = shopService.getCurrentOffers().stream()
                .map(o -> new ShopOfferResponse(o.id(), o.itemName(), o.rarity(), o.priceAmount(), o.priceCurrency(), o.weekKey()))
                .toList();
        return ResponseEntity.ok(body);
    }

    /** Requires login: spends real wallet currency and grants a real inventory item. */
    @PostMapping("/offers/{offerId}/buy")
    public ResponseEntity<InventoryItemResponse> buyOffer(@PathVariable UUID offerId, Authentication authentication) {
        InventoryItem item = shopService.buyOffer(authentication.getName(), offerId);
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
