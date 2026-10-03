package com.example.lootvaultproject.VaultController;

import com.example.lootvaultproject.VaultDTO.CreditWalletRequest;
import com.example.lootvaultproject.VaultDTO.WalletResponse;
import com.example.lootvaultproject.VaultEntity.Player;
import com.example.lootvaultproject.VaultService.AuthService;
import com.example.lootvaultproject.VaultService.WalletService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
@RestController
@RequestMapping("/api/wallets")
public class WalletController {

    private final WalletService walletService;
    private final AuthService authService;

    public WalletController(WalletService walletService, AuthService authService) {
        this.walletService = walletService;
        this.authService = authService;
    }

    /** The logged-in player's own wallet, resolved from the session. */
    @GetMapping("/me")
    public ResponseEntity<WalletResponse> getMyWallet(Authentication authentication) {
        Player player = authService.getByUsername(authentication.getName());
        return ResponseEntity.ok(walletService.getMyWallet(player.getId()));
    }

    @GetMapping("/{playerId}")
    public ResponseEntity<WalletResponse> getWallet(@PathVariable UUID playerId) {
        return ResponseEntity.ok(walletService.getWallet(playerId));
    }

    @PostMapping("/{playerId}/credit")
    public ResponseEntity<WalletResponse> credit(
            @PathVariable UUID playerId,
            @Valid @RequestBody CreditWalletRequest request) {
        return ResponseEntity.ok(walletService.credit(playerId, request));
    }
}
