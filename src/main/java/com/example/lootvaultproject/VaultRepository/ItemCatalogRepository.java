package com.example.lootvaultproject.VaultRepository;

import com.example.lootvaultproject.VaultEntity.ItemCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ItemCatalogRepository
        extends JpaRepository<ItemCatalog, UUID> {

    List<ItemCatalog> findByIsActiveTrue();

    List<ItemCatalog> findByRarity(String rarity);
}