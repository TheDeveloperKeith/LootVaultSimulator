import { api } from "./client";

export const getMyWallet = () => api.get("/api/wallets/me", { cache: "no-store" });
