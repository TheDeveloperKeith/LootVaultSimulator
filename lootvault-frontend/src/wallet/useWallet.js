import { useContext } from "react";
import { WalletContext } from "./walletContextStore";

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside a WalletProvider");
  return ctx;
}
