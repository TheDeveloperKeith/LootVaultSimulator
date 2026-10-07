import { api } from "./client";

export const getEarnState = () => api.get("/api/earn");
export const claimDailyCoins = () => api.post("/api/earn/daily/claim");
export const startHand = (game, stake, requestId, testHand, testResult, currency = "SOFT") => api.post("/api/earn/rounds", { game, stake, requestId, testHand, testResult, currency });
export const actOnHand = (round, action, raiseAmount = 0) => api.post(`/api/earn/rounds/${round.id}/actions`, { version: round.version, action, raiseAmount });
