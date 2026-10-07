package com.example.lootvaultproject.VaultController;
import com.example.lootvaultproject.VaultService.OpeningService;
import com.example.lootvaultproject.VaultDTO.InventoryItemResponse;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
@RestController
@RequestMapping("/api")
public class OpeningController {
    private final OpeningService service;
    public OpeningController(OpeningService service) {
        this.service=service;
    }
    public record BulkRequest(UUID requestId,List<UUID> crateIds) {
    }
    public record PullRequest(UUID requestId,int count) {
    }
    @GetMapping("/banners") public List<OpeningService.Banner> banners(Authentication auth) {
        return service.banners(auth.getName());
    }
    @PostMapping("/crates/open-bulk") public List<InventoryItemResponse> bulk(@RequestBody BulkRequest body,Authentication auth) {
        return service.bulk(auth.getName(),body.requestId(),body.crateIds());
    }
    @PostMapping("/banners/{code}/pull") public List<InventoryItemResponse> pull(@PathVariable String code,@RequestBody PullRequest body,Authentication auth) {
        return service.pull(auth.getName(),body.requestId(),code,body.count());
    }
}
