package com.example.lootvaultproject.VaultEntity;

import com.example.lootvaultproject.Domain.CurrencyType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ledger_entries")
public class LedgerEntry {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CurrencyType currency;

    @Column(nullable = false)
    private Long amount;

    @Column(name = "balance_after", nullable = false)
    private Long balanceAfter;

    @Column(name = "entry_type", nullable = false, length = 30)
    private String entryType;

    @Column(name = "ref_id")
    private UUID refId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected LedgerEntry() {
        // required no-arg constructor for JPA/Hibernate
    }

    public LedgerEntry(Wallet wallet, CurrencyType currency, Long amount, Long balanceAfter, String entryType) {
        this(wallet, currency, amount, balanceAfter, entryType, null);
    }

    public LedgerEntry(Wallet wallet, CurrencyType currency, Long amount, Long balanceAfter, String entryType, UUID refId) {
        this.wallet = wallet;
        this.currency = currency;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.entryType = entryType;
        this.refId = refId;
    }

    // Getters only — this table is append-only. Nothing should ever call
    // a setter on an existing LedgerEntry; a correction is a NEW row.
    public UUID getId() { return id; }
    public Wallet getWallet() { return wallet; }
    public CurrencyType getCurrency() { return currency; }
    public Long getAmount() { return amount; }
    public Long getBalanceAfter() { return balanceAfter; }
    public String getEntryType() { return entryType; }
    public UUID getRefId() { return refId; }
    public Instant getCreatedAt() { return createdAt; }
}
