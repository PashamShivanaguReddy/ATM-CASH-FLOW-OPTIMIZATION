import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Shield,
  Building,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';
import { formatRole, formatStatus, formatDate } from '../../utils/formatters';

export const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => userService.deleteUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  if (isLoading) {
    return <Loading fullScreen text="Loading user details..." />;
  }

  if (isError || !user) {
    return (
      <div className="space-y-4">
        <Link to="/users">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Users
          </Button>
        </Link>
        <ErrorState
          title="User not found"
          message={error instanceof Error ? error.message : 'Unable to locate user details.'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/users">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Users
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/users/${user.id}/edit`}>
            <Button variant="outline" size="sm" leftIcon={<Edit2 className="w-3.5 h-3.5" />}>
              Edit Profile
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Revoke Access
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card title="Account Overview" className="md:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Institutional Email
              </span>
              <p className="font-semibold text-slate-900 font-mono">{user.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Phone Number
              </span>
              <p className="font-semibold text-slate-900">{user.phone || 'Not recorded'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Security Role
              </span>
              <div>
                <Badge variant="primary">{formatRole(user.role)}</Badge>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                Account Status
              </span>
              <div>
                <Badge
                  variant={
                    user.status === 'ACTIVE'
                      ? 'success'
                      : user.status === 'LOCKED'
                      ? 'danger'
                      : 'neutral'
                  }
                  dot
                >
                  {formatStatus(user.status)}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Bank Scope
              </span>
              <p className="font-semibold text-slate-900">
                {user.bankId ? `Bank ID #${user.bankId}` : 'Global Enterprise (Cross-Bank)'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Created Timestamp
              </span>
              <p className="font-semibold text-slate-900">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </Card>

        <Card title="Security Clearance">
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              Role permissions are verified on every API Gateway invocation using cryptographic JWT validation.
            </p>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1.5">
              <div className="text-[11px] font-bold uppercase text-slate-500">
                Effective Capabilities:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                {user.role === 'SUPER_ADMIN' && (
                  <>
                    <li>Global Multi-Bank Provisioning</li>
                    <li>Full Cash Optimization Management</li>
                    <li>Audit Log Access</li>
                  </>
                )}
                {user.role === 'BANK_ADMIN' && (
                  <>
                    <li>Bank User Administration</li>
                    <li>ATM Deployment & Configuration</li>
                    <li>Cash Threshold Adjustments</li>
                  </>
                )}
                {user.role === 'BANK_MANAGER' && (
                  <>
                    <li>Cash Demand Predictions Review</li>
                    <li>Threshold Anomaly Alerts</li>
                    <li>Refill Recommendations Approval</li>
                  </>
                )}
                {user.role === 'ATM_OPERATOR' && (
                  <>
                    <li>Assigned ATM Physical Operations</li>
                    <li>Cash Replenishment Recording</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Revoke User Access"
        description="Are you sure you want to permanently delete this user? All session tokens will be invalidated."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              isLoading={deleteMutation.isPending}
            >
              Confirm Deletion
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          This user will lose access to <strong>{user.email}</strong> across all microservices immediately.
        </p>
      </Modal>
    </div>
  );
};
