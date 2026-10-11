import type { Wallet } from "../types/game";
import { api } from "./client";

export const getMyWallet = () => api.get<Wallet>("/api/wallets/me", { cache: "no-store" });
