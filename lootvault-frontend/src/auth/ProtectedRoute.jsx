import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const location = useLocation();
  const { player, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center" }}>Loading...</div>;
  }
  if (!player) {
    return <Navigate to="/login" replace state={{from:location.pathname,message:"Sign in to continue. Any unfinished hand stays saved."}} />;
  }
  return <Outlet />;
}
