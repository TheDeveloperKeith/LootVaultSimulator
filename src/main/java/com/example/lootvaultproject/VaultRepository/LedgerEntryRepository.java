package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {
    List<LedgerEntry> findByWallet_IdOrderByCreatedAtDesc(UUID walletId);
}