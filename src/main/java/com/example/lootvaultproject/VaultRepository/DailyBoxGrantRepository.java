package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.DailyBoxGrant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyBoxGrantRepository extends JpaRepository<DailyBoxGrant, UUID> {

    // Standard non-locking query for simple GET requests
    Optional<DailyBoxGrant> findByPlayerIdAndGrantDate(UUID playerId, LocalDate grantDate);

    // Pessimistic write lock (SELECT ... FOR UPDATE) for box opening to prevent concurrent race conditions
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DailyBoxGrant d WHERE d.playerId = :playerId AND d.grantDate = :grantDate")
    Optional<DailyBoxGrant> findByPlayerIdAndGrantDateWithLock(
            @Param("playerId") UUID playerId,
            @Param("grantDate") LocalDate grantDate
    );
}