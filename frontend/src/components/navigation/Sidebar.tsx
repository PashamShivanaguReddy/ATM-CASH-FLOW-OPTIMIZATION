import React from 'react';
import { NavLink } from 'react-router-dom';
import { Landmark, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getFilteredNavigation } from '../../constants/navigation';
import { formatRole } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, className }) => {
  const { user } = useAuth();
  const navItems = getFilteredNavigation(user?.role);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Application Navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/30">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">ATM OPTIMIZE</span>
              <span className="block text-[10px] uppercase tracking-wider text-blue-400 font-semibold">
                Cash Management
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-slate-200">
                {user?.role ? formatRole(user.role) : 'Authenticated'}
              </span>
              {user?.bankId && (
                <span className="text-slate-400 block text-[11px]">
                  Bank Scope #{user.bankId}
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            System Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                <span className="truncate">{item.title}</span>
                {item.badge && (
                  <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Gateway
            </span>
            <span className="font-mono text-[11px] text-slate-500">v1.2-rc</span>
          </div>
        </div>
      </aside>
    </>
  );
};
