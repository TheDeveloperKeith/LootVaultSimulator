package com.example.lootvaultproject.VaultController;

import com.example.lootvaultproject.VaultDTO.EarnResponse;
import com.example.lootvaultproject.VaultRepository.PlayerRepository;
import com.example.lootvaultproject.VaultService.EarnLootService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/earn")
public class EarnLootController {
    private final EarnLootService service;
    private final PlayerRepository players;
    public EarnLootController(EarnLootService service, PlayerRepository players) { this.service=service; this.players=players; }
    public record Start(UUID requestId, String game, long stake, String testHand, String testResult, String currency) {}
    public record Action(int version, String action, long raiseAmount) {}
    @GetMapping public EarnResponse get(Authentication auth) { return service.get(playerId(auth)); }
    @PostMapping("/daily/claim") public EarnResponse claim(Authentication auth) { return service.claimDaily(playerId(auth)); }
    @PostMapping("/rounds") public EarnResponse start(Authentication auth,@RequestBody Start request) { return service.start(playerId(auth),request.requestId(),request.game(),request.stake(),request.testHand(),request.testResult(),request.currency()); }
    @PostMapping("/rounds/{id}/actions") public EarnResponse act(Authentication auth,@PathVariable UUID id,@RequestBody Action request) { return service.act(playerId(auth),id,request.version(),request.action(),request.raiseAmount()); }
    private UUID playerId(Authentication auth) { return players.findByUsername(auth.getName()).orElseThrow(()->new IllegalArgumentException("Player not found.")).getId(); }
}
