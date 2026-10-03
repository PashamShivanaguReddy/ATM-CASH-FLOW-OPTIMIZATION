import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onForbidden = () => navigate("/unauthorized", { replace: true, state: { from: location.pathname } });
    window.addEventListener("auth:forbidden", onForbidden);
    return () => window.removeEventListener("auth:forbidden", onForbidden);
  }, [location.pathname, navigate]);

  return <Outlet />;
}