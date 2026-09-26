import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';
import { userService } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'BANK_ADMIN', 'BANK_MANAGER', 'ATM_OPERATOR']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
  bankId: z.coerce.number().nullable().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'ATM_OPERATOR',
      status: 'ACTIVE',
      bankId: 1,
    },
  });

  const selectedRole = watch('role');

  const createMutation = useMutation({
    mutationFn: (data: CreateUserFormData) => userService.createUser(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate(`/users/${created.id}`);
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to provision user.'
      );
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    setErrorMessage(null);
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/users">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Provision New User
          </h1>
          <p className="text-xs text-slate-500">
            Create institutional credentials and assign security permissions
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
              placeholder="e.g. Eleanor"
              required
              error={errors.firstName?.message}
              {...register('firstName')}
            />

            <Input
              label="Last Name"
              placeholder="e.g. Vance"
              required
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Institutional Email"
              type="email"
              placeholder="user@metrobank.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 555-0199"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <Input
            label="Temporary Access Password"
            type="password"
            placeholder="At least 6 characters"
            showPasswordToggle
            required
            error={errors.password?.message}
            {...register('password')}
          />

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
              placeholder={selectedRole === 'SUPER_ADMIN' ? 'None (Global)' : '1'}
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
            <Link to="/users">
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Provision Account
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
