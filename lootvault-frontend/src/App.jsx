import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import { WalletProvider } from "./wallet/WalletContext";
import AppShell from "./components/AppShell";
const MainMenuPage = lazy(() => import("./pages/MainMenuPage"));
const LootBoxPage = lazy(() => import("./pages/LootBoxPage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const ModesPage = lazy(() => import("./pages/ModesPage"));
const BannerModePage = lazy(() => import("./pages/BannerModePage"));
const CrateModePage = lazy(() => import("./pages/CrateModePage"));
const SandboxPage = lazy(() => import("./pages/SandboxPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ProgressionPage = lazy(() => import("./pages/ProgressionPage"));
const EarnLootPage = lazy(() => import("./pages/EarnLootPage"));

export default function App() {
    return (
        <AuthProvider>
            <WalletProvider>
                <BrowserRouter>
                    <Suspense fallback={<p role="status" style={{padding:"2rem"}}>Loading your vault…</p>}>
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
                    </Suspense>
                </BrowserRouter>
            </WalletProvider>
        </AuthProvider>
    );
}
