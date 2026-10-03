package com.example.lootvaultproject.VaultEntity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

/** An unopened crate a player owns. Deleted the moment it's opened or sold — see CrateService. */
@Entity
@Table(name = "inventory_crates")
public class InventoryCrate {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    /** Matches a key in CrateService.CRATE_DEFINITIONS, e.g. "COMMON", "EXTRA_EXTRAORDINARY". */
    @Column(name = "crate_code", nullable = false, length = 30)
    private String crateCode;

    @Column(name = "acquired_via", nullable = false, length = 30)
    private String acquiredVia;

    @Column(name = "acquired_at", nullable = false, updatable = false)
    private OffsetDateTime acquiredAt;

    @PrePersist
    protected void onCreate() {
        if (acquiredAt == null) acquiredAt = OffsetDateTime.now();
    }

    public InventoryCrate() {}

    public InventoryCrate(UUID playerId, String crateCode, String acquiredVia) {
        this.playerId = playerId;
        this.crateCode = crateCode;
        this.acquiredVia = acquiredVia;
    }

    public UUID getId() { return id; }
    public UUID getPlayerId() { return playerId; }
    public String getCrateCode() { return crateCode; }
    public String getAcquiredVia() { return acquiredVia; }
    public OffsetDateTime getAcquiredAt() { return acquiredAt; }
}
