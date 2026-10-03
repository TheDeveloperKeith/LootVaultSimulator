import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import { WalletProvider } from "./wallet/WalletContext";
import AppShell from "./components/AppShell";
import MainMenuPage from "./pages/MainMenuPage";
import LootBoxPage from "./pages/LootBoxPage";
import ShopPage from "./pages/ShopPage";
import InventoryPage from "./pages/InventoryPage";
import ModesPage from "./pages/ModesPage";
import BannerModePage from "./pages/BannerModePage";
import CrateModePage from "./pages/CrateModePage";
import SandboxPage from "./pages/SandboxPage";
import LoginPage from "./pages/LoginPage";
import ProgressionPage from "./pages/ProgressionPage";
import EarnLootPage from "./pages/EarnLootPage";

export default function App() {
    return (
        <AuthProvider>
            <WalletProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="login" element={<LoginPage />} />

                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppShell />}>
                                <Route index element={<Navigate to="/menu" replace />} />
                                <Route path="menu" element={<MainMenuPage />} />
                                <Route path="lootboxes" element={<LootBoxPage />} />
                                <Route path="modes" element={<ModesPage />} />
                                <Route path="banners" element={<BannerModePage />} />
                                <Route path="crates" element={<CrateModePage />} />
                                <Route path="sandbox" element={<SandboxPage />} />
                                <Route path="inventory" element={<InventoryPage />} />
                                <Route path="progression" element={<ProgressionPage />} />
                                <Route path="earn" element={<EarnLootPage />} />
                                <Route path="shop" element={<ShopPage />} />
                            </Route>
                        </Route>

                        <Route path="*" element={<Navigate to="/menu" replace />} />
                    </Routes>
                </BrowserRouter>
            </WalletProvider>
        </AuthProvider>
    );
}
