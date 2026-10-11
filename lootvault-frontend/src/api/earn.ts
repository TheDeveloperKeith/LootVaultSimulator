import type { Currency, EarnState, GameMode, HandAction, Round } from "../types/game";
import { api } from "./client";

export const getEarnState = () => api.get<EarnState>("/api/earn");
export const claimDailyCoins = () => api.post<EarnState>("/api/earn/daily/claim");
export const startHand = (game: GameMode, stake: number, requestId: string, testHand?: string, testResult?: string, currency: Currency = "SOFT") => api.post<EarnState>("/api/earn/rounds", { game, stake, requestId, testHand, testResult, currency });
export const actOnHand = (round: Pick<Round, "id" | "version">, action: HandAction, raiseAmount = 0) => api.post<EarnState>(`/api/earn/rounds/${round.id}/actions`, { version: round.version, action, raiseAmount });
