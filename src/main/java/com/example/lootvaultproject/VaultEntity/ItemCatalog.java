package com.example.lootvaultproject.VaultEntity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "item_catalog")
public class ItemCatalog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String rarity;

    @Column(name = "drop_rate", nullable = false, precision = 6, scale = 5)
    private BigDecimal dropRate;

    @Column(name = "banner_id")
    private UUID bannerId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private boolean limited;

    @Column(nullable = false)
    private boolean secret;

    @Column(name="limited_banner_code",length=50)
    private String limitedBannerCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public ItemCatalog() {}

    // Getters and Setters
    public boolean isSecret() { return secret; }
    public boolean isLimited() { return limited; }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getRarity() { return rarity; }
    public BigDecimal getDropRate() { return dropRate; }
    public UUID getBannerId() { return bannerId; }
    public Boolean getIsActive() { return isActive; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
