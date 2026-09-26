import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    clearError();
    try {
      await login(data);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Invalid email or password. Please try again.';
      setSubmitError(message);
    }
  };

  const setDemoCredentials = (email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
    setSubmitError(null);
    clearError();
  };

  const displayError = submitError || authError;

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your institutional credentials to manage ATM operations
        </p>
      </div>

      {displayError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{displayError}</span>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <Input
          label="Institutional Email"
          type="email"
          placeholder="operator@metrobank.com"
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            showPasswordToggle
            autoComplete="current-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="mt-1 text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          fullWidth
          size="md"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      <div className="border-t border-slate-200 pt-5 text-left">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Test Accounts (Phase 2 Testing):</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setDemoCredentials('superadmin@atmopt.bank')}
            className="flex flex-col items-start p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
          >
            <strong className="text-slate-800">Super Admin</strong>
            <span className="text-slate-500 font-mono text-[10px]">superadmin@atmopt.bank</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('bankadmin@metrobank.com')}
            className="flex flex-col items-start p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
          >
            <strong className="text-slate-800">Bank Admin</strong>
            <span className="text-slate-500 font-mono text-[10px]">bankadmin@metrobank.com</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('manager@metrobank.com')}
            className="flex flex-col items-start p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
          >
            <strong className="text-slate-800">Bank Manager</strong>
            <span className="text-slate-500 font-mono text-[10px]">manager@metrobank.com</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('operator@metrobank.com')}
            className="flex flex-col items-start p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
          >
            <strong className="text-slate-800">ATM Operator</strong>
            <span className="text-slate-500 font-mono text-[10px]">operator@metrobank.com</span>
          </button>
        </div>
      </div>
    </div>
  );
};
