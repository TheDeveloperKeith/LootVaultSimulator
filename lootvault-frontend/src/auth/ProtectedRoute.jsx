import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { player, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center" }}>Loading...</div>;
  }
  if (!player) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
