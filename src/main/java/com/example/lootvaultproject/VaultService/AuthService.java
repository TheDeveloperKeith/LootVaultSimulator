package com.example.lootvaultproject.VaultService;

import com.example.lootvaultproject.Domain.CurrencyType;
import com.example.lootvaultproject.VaultDTO.RegisterRequest;
import com.example.lootvaultproject.VaultEntity.LedgerEntry;
import com.example.lootvaultproject.VaultEntity.Player;
import com.example.lootvaultproject.VaultEntity.Wallet;
import com.example.lootvaultproject.VaultRepository.LedgerEntryRepository;
import com.example.lootvaultproject.VaultRepository.PlayerRepository;
import com.example.lootvaultproject.VaultRepository.WalletRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    /** Starting soft currency so a fresh account can actually try the shop and Unlimited Mode. */
    private static final long SIGNUP_BONUS_SOFT = 500L;

    private final PlayerRepository playerRepository;
    private final WalletRepository walletRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(PlayerRepository playerRepository, WalletRepository walletRepository,
                       LedgerEntryRepository ledgerEntryRepository, PasswordEncoder passwordEncoder) {
        this.playerRepository = playerRepository;
        this.walletRepository = walletRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Player registerPlayer(RegisterRequest request) {
        if (playerRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (playerRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already taken");
        }

        Player player = new Player(
                request.username(),
                request.email(),
                passwordEncoder.encode(request.password())
        );
        Player savedPlayer = playerRepository.save(player);

        // Atomic wallet creation + starting balance, in the same transaction as the account itself.
        Wallet wallet = new Wallet(savedPlayer.getId(), SIGNUP_BONUS_SOFT, 0L);
        wallet = walletRepository.save(wallet);
        ledgerEntryRepository.save(
                new LedgerEntry(wallet, CurrencyType.SOFT, SIGNUP_BONUS_SOFT, SIGNUP_BONUS_SOFT, "SIGNUP_BONUS"));

        return savedPlayer;
    }

    public Player getByUsername(String username) {
        return playerRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    public Player createTestPlayer() {
        String suffix = java.util.UUID.randomUUID().toString().replace("-", "");
        Player player = registerPlayer(new RegisterRequest("dev_" + suffix, "dev_" + suffix + "@testing.invalid", java.util.UUID.randomUUID().toString()));
        Wallet wallet = walletRepository.findByPlayerId(player.getId()).orElseThrow();
        wallet.setSoftBalance(com.example.lootvaultproject.Config.DevMode.TEST_BALANCE);
        walletRepository.save(wallet);
        return player;
    }
}
