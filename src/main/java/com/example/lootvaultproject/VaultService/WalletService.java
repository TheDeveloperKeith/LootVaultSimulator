package com.example.lootvaultproject.VaultService;

import com.example.lootvaultproject.Domain.CurrencyType;

import com.example.lootvaultproject.VaultEntity.LedgerEntry;
import com.example.lootvaultproject.VaultEntity.Wallet;
import com.example.lootvaultproject.VaultDTO.CreditWalletRequest;
import com.example.lootvaultproject.VaultDTO.WalletResponse;
import com.example.lootvaultproject.VaultException.InsufficientBalanceException;
import com.example.lootvaultproject.VaultException.PlayerNotFoundException;
import com.example.lootvaultproject.VaultRepository.LedgerEntryRepository;
import com.example.lootvaultproject.VaultRepository.WalletRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    public WalletService(WalletRepository walletRepository, LedgerEntryRepository ledgerEntryRepository) {
        this.walletRepository = walletRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
    }

    public WalletResponse getWallet(UUID playerId) {
        Wallet wallet = walletRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));
        return toResponse(wallet);
    }

    @Transactional
    public WalletResponse credit(UUID playerId, CreditWalletRequest request) {
        Wallet wallet = walletRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        CurrencyType currency = CurrencyType.valueOf(request.getCurrency());
        long newBalance;

        if (currency == CurrencyType.SOFT) {
            wallet.creditSoft(request.getAmount());
            newBalance = wallet.getSoftBalance();
        } else {
            wallet.creditHard(request.getAmount());
            newBalance = wallet.getHardBalance();
        }

        walletRepository.save(wallet);
        ledgerEntryRepository.save(new LedgerEntry(wallet, currency, request.getAmount(), newBalance, "TOPUP"));

        return toResponse(wallet);
    }
    /**
     * Credits currency to a wallet and records the reason
     * in the ledger.
     *
     * @param playerId player receiving the currency
     * @param currency type of currency being credited
     * @param amount amount being credited
     * @param entryType reason for the credit
     * @param refId related entity ID
     * @return updated wallet
     */
    @Transactional
    public Wallet creditWithReason(
            UUID playerId,
            CurrencyType currency,
            long amount,
            String entryType,
            UUID refId) {

        Wallet wallet = walletRepository.findByPlayerId(playerId)
                .orElseThrow(() ->
                        new PlayerNotFoundException(playerId));

        long newBalance;

        if (currency == CurrencyType.SOFT) {
            wallet.creditSoft(amount);
            newBalance = wallet.getSoftBalance();
        } else {
            wallet.creditHard(amount);
            newBalance = wallet.getHardBalance();
        }

        walletRepository.save(wallet);

        ledgerEntryRepository.save(
                new LedgerEntry(
                        wallet,
                        currency,
                        amount,
                        newBalance,
                        entryType,
                        refId
                )
        );

        return wallet;
    }

    /**
     * Debits a wallet and writes the matching ledger row. Shared by every
     * spend path (shop purchases, paid loot box opens, future marketplace
     * buys) so "how do I take a player's currency" is written exactly once.
     * Throws InsufficientBalanceException rather than letting the balance
     * go negative — the CHECK constraints on the columns are the last line
     * of defense, this is the first.
     */
    @Transactional
    public Wallet debit(UUID playerId, CurrencyType currency, long amount, String entryType, UUID refId) {
        Wallet wallet = walletRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        long available = currency == CurrencyType.SOFT ? wallet.getSoftBalance() : wallet.getHardBalance();
        if (available < amount) {
            throw new InsufficientBalanceException(currency.name(), amount, available);
        }

        long newBalance;
        if (currency == CurrencyType.SOFT) {
            wallet.setSoftBalance(wallet.getSoftBalance() - amount);
            newBalance = wallet.getSoftBalance();
        } else {
            wallet.setHardBalance(wallet.getHardBalance() - amount);
            newBalance = wallet.getHardBalance();
        }

        walletRepository.save(wallet);
        ledgerEntryRepository.save(new LedgerEntry(wallet, currency, -amount, newBalance, entryType, refId));

        return wallet;
    }

    public WalletResponse getMyWallet(UUID playerId) {
        return getWallet(playerId);
    }

    private WalletResponse toResponse(Wallet wallet) {
        return new WalletResponse(wallet.getId(), wallet.getPlayerId(), wallet.getSoftBalance(), wallet.getHardBalance());
    }
}
