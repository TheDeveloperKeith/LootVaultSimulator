import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getGems } from "../api/gems";
import { getMyWallet } from "../api/wallet";
import { useAuth } from "../auth/AuthContext";

const WalletContext = createContext(null);

// Central place for "how much currency does the player have right now."
// Any page that spends currency (shop, unlimited boxes) calls refresh()
// after a purchase so the header updates everywhere at once, instead of
// each page tracking its own stale copy of the balance.
export function WalletProvider({ children }) {
  const { player } = useAuth();
  const [snapshot, setSnapshot] = useState(null);
  const latestRequest = useRef(0);
  const wallet = snapshot?.player === player ? snapshot.value : null;
  const gems = snapshot?.player === player ? snapshot.gems : null;

  const refresh = useCallback(async () => {
    const request = ++latestRequest.current;
    if (!player) return;
    try {
      const [value, gems] = await Promise.all([getMyWallet(),getGems()]);
      if (request === latestRequest.current) setSnapshot({ player, value, gems });
    } catch {
      // A temporary network failure must not erase the last confirmed balance.
    }
  }, [player]);

  useEffect(() => {
    const sync = () => { void refresh(); };
    const visible = () => { if (document.visibilityState === "visible") sync(); };
    void Promise.resolve().then(sync);
    window.addEventListener("lootvault:wallet-changed", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener("lootvault:wallet-changed", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);

  return (
    <WalletContext.Provider value={{ wallet, gems, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}

// This context intentionally exports its provider and consumer hook together.
// eslint-disable-next-line react-refresh/only-export-components
export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside a WalletProvider");
  return ctx;
}
