import { createContext } from "react";

// Shared identity stays outside the component Fast Refresh boundary.
export const WalletContext = createContext(null);
