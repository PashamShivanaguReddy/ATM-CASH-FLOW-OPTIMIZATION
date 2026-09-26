import { UserRole } from '../types/auth';

export const USER_ROLES: Record<UserRole, UserRole> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BANK_ADMIN: 'BANK_ADMIN',
  BANK_MANAGER: 'BANK_MANAGER',
  ATM_OPERATOR: 'ATM_OPERATOR',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    'dashboard:view',
    'users:manage',
    'users:view',
    'atms:manage',
    'atms:view',
    'transactions:view',
    'cash:manage',
    'cash:view',
    'refills:manage',
    'refills:view',
    'predictions:view',
    'alerts:view',
    'optimization:view',
    'optimization:manage',
    'reports:view',
    'settings:manage',
  ],
  BANK_ADMIN: [
    'dashboard:view',
    'users:manage',
    'users:view',
    'atms:manage',
    'atms:view',
    'transactions:view',
    'cash:manage',
    'cash:view',
    'refills:manage',
    'refills:view',
    'reports:view',
    'settings:manage',
  ],
  BANK_MANAGER: [
    'dashboard:view',
    'atms:view',
    'transactions:view',
    'predictions:view',
    'alerts:view',
    'optimization:view',
    'refills:approve',
  ],
  ATM_OPERATOR: [
    'dashboard:view',
    'atms:view',
    'cash:manage',
    'cash:view',
    'refills:manage',
    'refills:view',
  ],
};

export function hasPermission(role: UserRole | undefined, permission: string): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
