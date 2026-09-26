import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Receipt,
  Coins,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Sliders,
  Settings,
} from 'lucide-react';
import type { UserRole } from '../types/auth';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  badge?: string;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER', 'ATM_OPERATOR'],
  },
  {
    title: 'User Management',
    href: '/users',
    icon: Users,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN'],
  },
  {
    title: 'ATMs',
    href: '/atms',
    icon: Building2,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER', 'ATM_OPERATOR'],
  },
  {
    title: 'Transactions',
    href: '/transactions',
    icon: Receipt,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER'],
  },
  {
    title: 'Cash Inventory',
    href: '/cash-inventory',
    icon: Coins,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'ATM_OPERATOR'],
  },
  {
    title: 'Refill Operations',
    href: '/refills',
    icon: RefreshCw,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'ATM_OPERATOR'],
  },
  {
    title: 'Predictions',
    href: '/predictions',
    icon: TrendingUp,
    allowedRoles: ['SUPER_ADMIN', 'BANK_MANAGER'],
  },
  {
    title: 'Alerts',
    href: '/alerts',
    icon: AlertTriangle,
    allowedRoles: ['SUPER_ADMIN', 'BANK_MANAGER'],
  },
  {
    title: 'Optimization',
    href: '/optimization',
    icon: Sliders,
    allowedRoles: ['SUPER_ADMIN', 'BANK_MANAGER'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN'],
  },
];

export function getFilteredNavigation(role?: UserRole): NavItem[] {
  if (!role) return [];
  if (role === 'SUPER_ADMIN') return NAVIGATION_ITEMS;
  return NAVIGATION_ITEMS.filter((item) => item.allowedRoles.includes(role));
}
