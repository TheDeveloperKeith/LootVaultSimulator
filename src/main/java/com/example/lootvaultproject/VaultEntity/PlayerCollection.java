package com.example.lootvaultproject.VaultEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents an item that a player has discovered.
 *
 * The database primary key is the combination of
 * player_id and item_catalog_id.
 */
@Entity
@Table(name = "player_collection")
@IdClass(PlayerCollectionId.class)
public class PlayerCollection {

    @Id
    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Id
    @Column(name = "item_catalog_id", nullable = false)
    private UUID itemCatalogId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(
            name = "item_catalog_id",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private ItemCatalog itemCatalog;

    @Column(name = "first_obtained_at", nullable = false)
    private OffsetDateTime firstObtainedAt;

    /**
     * Required by JPA.
     */
    protected PlayerCollection() {
    }

    /**
     * Creates a collection entry.
     *
     * @param playerId player identifier
     * @param itemCatalog discovered item
     */
    public PlayerCollection(
            UUID playerId,
            ItemCatalog itemCatalog) {

        this.playerId = playerId;
        this.itemCatalogId = itemCatalog.getId();
        this.itemCatalog = itemCatalog;
        this.firstObtainedAt = OffsetDateTime.now();
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public UUID getItemCatalogId() {
        return itemCatalogId;
    }

    public ItemCatalog getItemCatalog() {
        return itemCatalog;
    }

    public OffsetDateTime getFirstObtainedAt() {
        return firstObtainedAt;
    }
}