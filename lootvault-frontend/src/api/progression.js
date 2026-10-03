import { api } from "./client";

export const getCollection = () => api.get("/api/progression/collection");
export const getQuests = () => api.get("/api/progression/quests");
export const getPity = () => api.get("/api/progression/pity");
export const claimQuest = (id) => api.post(`/api/progression/quests/${id}/claim`);
export const craftItems = (inventoryItemIds) => api.post("/api/crafting", { inventoryItemIds });
