import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatRole } from '../../utils/formatters';
import { Badge } from '../ui/Badge';

export interface NavbarProps {
  onToggleSidebar: () => void;
  breadcrumbs?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, breadcrumbs }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">{breadcrumbs}</div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
          </span>
        </button>

        <div className="h-6 w-px bg-slate-200" aria-hidden="true" />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200">
              {user?.firstName ? user.firstName[0] : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-semibold text-slate-800">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
              </div>
              <div className="text-[11px] text-slate-500">
                {user?.role ? formatRole(user.role) : 'User'}
              </div>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="border-b border-slate-100 px-4 py-2">
                <p className="text-xs font-medium text-slate-900 truncate">{user?.email}</p>
                <div className="mt-1">
                  <Badge variant="primary">
                    {user?.role ? formatRole(user.role) : 'Authenticated'}
                  </Badge>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
