package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {
    Optional<Wallet> findByPlayerId(UUID playerId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select w from Wallet w where w.playerId = :playerId")
    Optional<Wallet> findByPlayerIdWithLock(@org.springframework.data.repository.query.Param("playerId") UUID playerId);
}
