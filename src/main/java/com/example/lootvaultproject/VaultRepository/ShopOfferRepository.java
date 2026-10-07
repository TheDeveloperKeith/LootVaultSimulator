package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.ShopOffer;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShopOfferRepository extends JpaRepository<ShopOffer, UUID> {
    List<ShopOffer> findByWeekKey(String weekKey);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = """
        INSERT INTO shop_offers (item_catalog_id, price_amount, price_currency, week_key)
        SELECT id, CASE WHEN name = 'Mystery Harbor' THEN 100000 ELSE CASE rarity WHEN 'COMMON' THEN 25 WHEN 'BASIC' THEN 60
            WHEN 'EXCELLENT' THEN 150 WHEN 'EXOTIC' THEN 750
            WHEN 'EXTRAORDINARY' THEN 12000 ELSE 60000 END END, 'SOFT', :weekKey
        FROM (SELECT id, name, rarity, row_number() OVER
            (PARTITION BY rarity ORDER BY md5(CAST(id AS text) || :weekKey)) AS slot
            FROM item_catalog WHERE limited = false AND (is_active = true OR rarity = 'EXTRA_EXTRAORDINARY')) picks
        WHERE slot <= 2
        ON CONFLICT (item_catalog_id, week_key) DO UPDATE SET price_amount = EXCLUDED.price_amount
        """, nativeQuery = true)
    void ensureWeeklyOffers(@org.springframework.data.repository.query.Param("weekKey") String weekKey);

    boolean existsByWeekKey(String weekKey);
}
