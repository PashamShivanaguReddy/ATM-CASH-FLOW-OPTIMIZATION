import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { userService } from '../../services/userService';
import type { UserRole, UserStatus } from '../../types/auth';
import type { UserDto, UserFilterParams } from '../../types/user';
import { Button } from '../../components/ui/Button';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { ErrorState } from '../../components/ui/ErrorState';
import { useDebounce } from '../../hooks/useDebounce';
import { formatRole } from '../../utils/formatters';

export const UserList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);

  const queryParams: UserFilterParams = {
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    page,
    size,
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users', queryParams],
    queryFn: () => userService.getUsers(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null);
    },
  });

  const handleDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" dot>
            Active
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge variant="neutral" dot>
            Inactive
          </Badge>
        );
      case 'LOCKED':
        return (
          <Badge variant="danger" dot>
            Locked
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="primary">Super Admin</Badge>;
      case 'BANK_ADMIN':
        return <Badge variant="info">Bank Admin</Badge>;
      case 'BANK_MANAGER':
        return <Badge variant="warning">Bank Manager</Badge>;
      case 'ATM_OPERATOR':
        return <Badge variant="neutral">ATM Operator</Badge>;
    }
  };

  const columns: Column<UserDto>[] = [
    {
      key: 'name',
      header: 'User / Identity',
      render: (u) => (
        <div>
          <div className="font-semibold text-slate-900">
            {u.firstName} {u.lastName}
          </div>
          <div className="text-xs text-slate-500 font-mono">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => getRoleBadge(u.role),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => getStatusBadge(u.status),
    },
    {
      key: 'bankId',
      header: 'Bank Scope',
      render: (u) => (
        <span className="text-xs text-slate-600 font-medium">
          {u.bankId ? `Bank #${u.bankId}` : 'Global (All Banks)'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/users/${u.id}`)}
            aria-label={`View user ${u.firstName} ${u.lastName}`}
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/users/${u.id}/edit`)}
            aria-label={`Edit user ${u.firstName} ${u.lastName}`}
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUserToDelete(u)}
            aria-label={`Delete user ${u.firstName} ${u.lastName}`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Users
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrative personnel, branch managers, and field ATM operators
          </p>
        </div>

        <Link to="/users/create">
          <Button leftIcon={<UserPlus className="w-4 h-4" />}>
            Provision New User
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative sm:col-span-6">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email address..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | '');
              setPage(0);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="BANK_ADMIN">Bank Admin</option>
            <option value="BANK_MANAGER">Bank Manager</option>
            <option value="ATM_OPERATOR">ATM Operator</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as UserStatus | '');
              setPage(0);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOCKED">Locked</option>
          </select>
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="Failed to load user directory"
          message={error instanceof Error ? error.message : 'Network error occurred.'}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-0">
          <Table
            columns={columns}
            data={data?.content || []}
            keyExtractor={(u) => u.id}
            isLoading={isLoading}
            emptyMessage="No users matched your query or filter criteria."
            onRowClick={(u) => navigate(`/users/${u.id}`)}
          />

          {data && (
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={size}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setSize(newSize);
                setPage(0);
              }}
            />
          )}
        </div>
      )}

      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Revoke User Access"
        description="Are you sure you want to permanently delete this user account? This action cannot be undone."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Confirm Deletion
            </Button>
          </>
        }
      >
        {userToDelete && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs space-y-1">
            <p>
              <strong>Name:</strong> {userToDelete.firstName} {userToDelete.lastName}
            </p>
            <p>
              <strong>Email:</strong> {userToDelete.email}
            </p>
            <p>
              <strong>Role:</strong> {formatRole(userToDelete.role)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
