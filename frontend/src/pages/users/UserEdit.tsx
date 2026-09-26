import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { userService } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { ErrorState } from '../../components/ui/ErrorState';

const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER', 'ATM_OPERATOR']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
  bankId: z.coerce.number().nullable().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export const UserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: user.status,
        bankId: user.bankId,
      });
    }
  }, [user, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditUserFormData) => userService.updateUser(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      navigate(`/users/${id}`);
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update user profile.'
      );
    },
  });

  const onSubmit = (data: EditUserFormData) => {
    setErrorMessage(null);
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading user profile..." />;
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
    <div className="space-y-6 text-left max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to={`/users/${id}`}>
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Edit User Profile
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Modifying credentials for #{user.id} ({user.email})
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              required
              error={errors.firstName?.message}
              {...register('firstName')}
            />

            <Input
              label="Last Name"
              required
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Institutional Email"
              type="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number"
              type="tel"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Security Role"
              required
              error={errors.role?.message}
              {...register('role')}
            >
              <option value="ATM_OPERATOR">ATM Operator</option>
              <option value="BANK_MANAGER">Bank Manager</option>
              <option value="BANK_ADMIN">Bank Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </Select>

            <Select
              label="Account Status"
              required
              error={errors.status?.message}
              {...register('status')}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </Select>

            <Input
              label="Bank ID Scope"
              type="number"
              disabled={selectedRole === 'SUPER_ADMIN'}
              helperText={
                selectedRole === 'SUPER_ADMIN'
                  ? 'Super Admins span all banks'
                  : 'Assigns bank authority'
              }
              error={errors.bankId?.message}
              {...register('bankId')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link to={`/users/${id}`}>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="sm"
              isLoading={updateMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
