import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loading } from "../ui/Loading";
import { useAuthContext } from "../../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) return <Loading label="Restoring secure session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}