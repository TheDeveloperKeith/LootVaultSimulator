package com.example.lootvaultproject.VaultEntity;

import com.example.lootvaultproject.Domain.CurrencyType;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * One purchasable slot in a given week's shop. Rows are generated lazily by
 * ShopService the first time anyone asks for the shop in a new ISO week
 * (see week_key), then reused by everyone until the week rolls over.
 */
@Entity
@Table(name = "shop_offers")
public class ShopOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_catalog_id", nullable = false)
    private ItemCatalog itemCatalog;

    @Column(name = "price_amount", nullable = false)
    private Long priceAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_currency", nullable = false, length = 10)
    private CurrencyType priceCurrency;

    /** ISO week, e.g. "2026-W40". Everyone sees the same offers within a week. */
    @Column(name = "week_key", nullable = false, length = 10)
    private String weekKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    public ShopOffer() {}

    public ShopOffer(ItemCatalog itemCatalog, Long priceAmount, CurrencyType priceCurrency, String weekKey) {
        this.itemCatalog = itemCatalog;
        this.priceAmount = priceAmount;
        this.priceCurrency = priceCurrency;
        this.weekKey = weekKey;
    }

    public UUID getId() { return id; }
    public ItemCatalog getItemCatalog() { return itemCatalog; }
    public Long getPriceAmount() { return priceAmount; }
    public CurrencyType getPriceCurrency() { return priceCurrency; }
    public String getWeekKey() { return weekKey; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
