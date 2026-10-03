import { Bell, Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Breadcrumb } from "./Breadcrumb";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const logout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="sm" aria-label="Open navigation" className="lg:hidden" onClick={onMenuClick}><Menu aria-hidden="true" className="size-5" /></Button>
        <Breadcrumb />
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="sm" aria-label="Search" className="hidden sm:inline-flex"><Search aria-hidden="true" className="size-4" /></Button>
        <Button variant="ghost" size="sm" aria-label="Notifications" className="relative"><Bell aria-hidden="true" className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-amber" /></Button>
        <span className="hidden h-8 w-px bg-line sm:block" />
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-[#dcefe8] text-xs font-bold uppercase text-moss">{user?.name.slice(0, 2) ?? "--"}</span>
          <span className="hidden sm:block"><span className="block max-w-40 truncate text-xs font-bold text-ink">{user?.name}</span><span className="block text-[10px] text-muted">{user?.role.replaceAll("_", " ")}</span></span>
          <button type="button" onClick={() => void logout()} className="ml-1 text-xs font-semibold text-muted hover:text-ink">Sign out</button>
        </div>
      </div>
    </header>
  );
}