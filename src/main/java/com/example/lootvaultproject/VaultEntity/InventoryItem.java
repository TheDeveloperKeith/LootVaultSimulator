package com.example.lootvaultproject.VaultEntity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_catalog_id", nullable = false)
    private ItemCatalog itemCatalog;

    @Column(name = "acquired_via", nullable = false, length = 30)
    private String acquiredVia;

    @Column(name = "is_listed", nullable = false)
    private Boolean isListed = false;

    @Column(name = "acquired_at", nullable = false, updatable = false)
    private OffsetDateTime acquiredAt;

    @PrePersist
    protected void onCreate() {
        if (acquiredAt == null) {
            acquiredAt = OffsetDateTime.now();
        }
    }

    public InventoryItem() {}

    public InventoryItem(UUID playerId, ItemCatalog itemCatalog, String acquiredVia) {
        this.playerId = playerId;
        this.itemCatalog = itemCatalog;
        this.acquiredVia = acquiredVia;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public UUID getPlayerId() { return playerId; }
    public ItemCatalog getItemCatalog() { return itemCatalog; }
    public String getAcquiredVia() { return acquiredVia; }
    public Boolean getIsListed() { return isListed; }
    public OffsetDateTime getAcquiredAt() { return acquiredAt; }
}
