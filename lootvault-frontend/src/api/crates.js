import { api } from "./client";

export const getCrateTypes = () => api.get("/api/crates/types");
export const getMyCrates = () => api.get("/api/crates/inventory");
export const buyCrate = (crateCode) => api.post(`/api/crates/${crateCode}/buy`);
export const openCrate = (inventoryCrateId) => api.post(`/api/crates/${inventoryCrateId}/open`);
export const sellCrate = (inventoryCrateId) => api.post(`/api/crates/${inventoryCrateId}/sell`);
