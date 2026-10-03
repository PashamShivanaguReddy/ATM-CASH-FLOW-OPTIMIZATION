import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import type { UserRole } from "../../types/auth";

export function RoleProtectedRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user } = useAuthContext();
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}