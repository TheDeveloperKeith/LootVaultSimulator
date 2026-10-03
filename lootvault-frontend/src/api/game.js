import { api } from "./client";

export const getTodayGrant = () => api.get("/api/lootboxes");

export const openLootBox = () => api.post("/api/lootboxes/open");

export const getInventory = () => api.get("/api/inventory");

export const sellItem = (inventoryItemId) =>
    api.post(`/api/inventory/${inventoryItemId}/sell`);