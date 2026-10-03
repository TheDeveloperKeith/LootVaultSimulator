package com.example.lootvaultproject.VaultDTO;

import java.util.List;
import java.util.UUID;

public record CraftRequest(List<UUID> inventoryItemIds) {
}
