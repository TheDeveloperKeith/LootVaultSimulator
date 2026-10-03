package com.example.lootvaultproject.VaultEntity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * Composite primary key for PlayerCollection.
 */
public class PlayerCollectionId implements Serializable {

    private UUID playerId;
    private UUID itemCatalogId;

    /**
     * Required by JPA.
     */
    public PlayerCollectionId() {
    }

    /**
     * Creates a player collection ID.
     *
     * @param playerId player identifier
     * @param itemCatalogId item catalog identifier
     */
    public PlayerCollectionId(
            UUID playerId,
            UUID itemCatalogId) {

        this.playerId = playerId;
        this.itemCatalogId = itemCatalogId;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public UUID getItemCatalogId() {
        return itemCatalogId;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (!(obj instanceof PlayerCollectionId other)) {
            return false;
        }

        return Objects.equals(playerId, other.playerId)
                && Objects.equals(
                itemCatalogId,
                other.itemCatalogId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(
                playerId,
                itemCatalogId);
    }
}