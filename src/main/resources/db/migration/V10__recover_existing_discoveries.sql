-- Recover still-owned discoveries missed by earlier item award paths.
-- Sold historical items cannot be reconstructed from this ownership table.
INSERT INTO player_collection(player_id,item_catalog_id,first_obtained_at)
SELECT player_id,item_catalog_id,min(acquired_at) FROM inventory_items
GROUP BY player_id,item_catalog_id
ON CONFLICT (player_id,item_catalog_id) DO NOTHING;
