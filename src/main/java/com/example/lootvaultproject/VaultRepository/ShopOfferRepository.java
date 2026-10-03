package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.ShopOffer;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShopOfferRepository extends JpaRepository<ShopOffer, UUID> {
    List<ShopOffer> findByWeekKey(String weekKey);
    boolean existsByWeekKey(String weekKey);
}
