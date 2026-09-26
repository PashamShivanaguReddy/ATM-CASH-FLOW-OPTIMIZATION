import type { UserRole, UserStatus } from '../types/auth';

export function formatRole(role: UserRole | string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'BANK_ADMIN':
      return 'Bank Admin';
    case 'BANK_MANAGER':
      return 'Bank Manager';
    case 'ATM_OPERATOR':
      return 'ATM Operator';
    default:
      return role.replace(/_/g, ' ');
  }
}

export function formatStatus(status: UserStatus | string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'INACTIVE':
      return 'Inactive';
    case 'LOCKED':
      return 'Locked';
    default:
      return status;
  }
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}
