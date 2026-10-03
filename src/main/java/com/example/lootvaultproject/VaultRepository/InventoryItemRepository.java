package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryItemRepository
        extends JpaRepository<InventoryItem, UUID> {

    List<InventoryItem> findByPlayerIdOrderByAcquiredAtDesc(
            UUID playerId);

    Optional<InventoryItem> findByIdAndPlayerId(
            UUID id, UUID playerId);
}