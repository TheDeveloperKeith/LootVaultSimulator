import { api } from "./client";
export const getGems = () => api.get("/api/gems");
export const claimDailyGems = () => api.post("/api/gems/daily/claim");
export const exchangeCrateForGems = (requestId,crateId) => api.post("/api/gems/exchange",{requestId,crateId});
export const buyLuckPotion = (requestId,kind) => api.post("/api/gems/potions",{requestId,kind});
