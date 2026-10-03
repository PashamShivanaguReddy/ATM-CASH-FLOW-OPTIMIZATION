import { Activity, ArrowUpRight, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import flowlineMark from "../../assets/flowline-mark.svg";
import { navigationItems } from "../../constants/navigation";
import { useAuthContext } from "../../context/AuthContext";
import type { UserRole } from "../../types/auth";
import { Button } from "../ui/Button";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuthContext();
  const visibleItems = navigationItems.filter((item) => user && item.allowedRoles.includes(user.role));
  return (
    <>
      {open && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-[#071512]/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-[#14221f] text-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
          <NavLink to="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <span className="grid size-9 place-items-center rounded-md bg-[#cce7da]"><img src={flowlineMark} alt="" className="size-5" /></span>
            <span><span className="block text-[15px] font-bold tracking-[0.02em]">Flowline</span><span className="mt-0.5 block text-[10px] font-medium text-white/50">CASH OPERATIONS</span></span>
          </NavLink>
          <Button variant="ghost" size="sm" aria-label="Close navigation" className="text-white/70 hover:bg-white/10 hover:text-white lg:hidden" onClick={onClose}><X aria-hidden="true" className="size-4" /></Button>
        </div>
        <div className="px-3 pt-6">
          {(["Workspace", "Management"] as const).filter((group) => visibleItems.some((item) => item.group === group)).map((group) => (
            <div key={group} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">{group}</p>
              <nav aria-label={group} className="grid gap-1">
                {visibleItems.filter((item) => item.group === group).map(({ label, path, icon: Icon }) => (
                  <NavLink key={path} to={path} onClick={onClose} className={({ isActive }) => `group flex h-10 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors ${isActive ? "bg-[#2d473f] text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}>
                    <Icon aria-hidden="true" className="size-[17px] shrink-0" /><span className="flex-1">{label}</span>
                    {path === "/alerts" && <span className="grid size-5 place-items-center rounded bg-[#bf7540] text-[10px] font-bold text-white">4</span>}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="mt-auto p-3">
          {user?.role === ("SUPER_ADMIN" satisfies UserRole) && <NavLink to="/settings" onClick={onClose} className={({ isActive }) => `mb-3 flex h-10 items-center gap-3 rounded-md px-3 text-[13px] font-medium ${isActive ? "bg-[#2d473f] text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}><Activity aria-hidden="true" className="size-[17px]" />Settings</NavLink>}
          <div className="rounded-md border border-white/10 bg-white/[0.045] p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold"><span>Network status</span><span className="flex items-center gap-1.5 text-[#9bd6b5]"><span className="size-1.5 rounded-full bg-[#7ac49b]" />Operational</span></div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/45">All connected services are responding normally.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-white/70">System health <ArrowUpRight aria-hidden="true" className="size-3" /></span>
          </div>
          <p className="px-1 pb-1 pt-4 text-[10px] text-white/30">ATM CASH FLOW OPTIMIZATION · 0.1.0</p>
        </div>
      </aside>
    </>
  );
}