import { ChevronRight, House } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { navigationItems } from "../../constants/navigation";

export function Breadcrumb() {
  const { pathname } = useLocation();
  const current = navigationItems.find((item) => item.path === pathname);
  const label = current?.label ?? (pathname === "/settings" ? "Settings" : "Workspace");

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted">
      <Link to="/dashboard" aria-label="Overview" className="hover:text-ink"><House aria-hidden="true" className="size-3.5" /></Link>
      <ChevronRight aria-hidden="true" className="size-3" />
      <span aria-current="page" className="font-semibold text-ink">{label}</span>
    </nav>
  );
}