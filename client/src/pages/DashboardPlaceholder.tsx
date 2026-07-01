import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Star,
  X,
} from 'lucide-react';
import { changePasswordSchema, type ChangePasswordInput } from '@store-rating/shared';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logoutThunk } from '@/features/auth/authSlice';
import { api } from '@/lib/api';
import { useNavigate, Navigate } from 'react-router-dom';
import { StoreDiscovery } from './customer/StoreDiscovery';
import { OwnerDashboard } from './owner/OwnerDashboard';

interface ChangePasswordFormProps {
  onClose: () => void;
}

function ChangePasswordModal({ onClose }: ChangePasswordFormProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (data: ChangePasswordInput) => {
    setServerError(null);
    try {
      await api.patch('/auth/password', data);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to update password';
      setServerError(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 id="change-password-title" className="text-base font-semibold text-zinc-100">
              Change password
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              All active sessions will be signed out after a successful change.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="alert-success">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Password updated. Please sign in again on other devices.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {serverError && (
              <div className="alert-error" role="alert">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Current password */}
            <div>
              <label htmlFor="cp-current" className="label">
                Current password
              </label>
              <div className="relative">
                <input
                  id="cp-current"
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`input pr-11 ${errors.currentPassword ? 'input-error' : ''}`}
                  {...register('currentPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="field-error">{errors.currentPassword.message}</p>
              )}
            </div>

            {/* New password */}
            <div>
              <label htmlFor="cp-new" className="label">
                New password
              </label>
              <div className="relative">
                <input
                  id="cp-new"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`input pr-11 ${errors.newPassword ? 'input-error' : ''}`}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="field-error">{errors.newPassword.message}</p>}
            </div>

            <button
              id="change-password-submit"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                'Update password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function DashboardPlaceholder() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (user?.role === 'SYSTEM_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const role = user?.role ?? 'NORMAL_USER';

  const handleLogout = async () => {
    setLoggingOut(true);
    await dispatch(logoutThunk());
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Topbar */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Star className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-100">RateStore</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="open-change-password"
              onClick={() => setShowChangePassword(true)}
              className="btn-ghost"
            >
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">Change password</span>
            </button>
            <button
              id="logout-button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-danger"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content switched dynamically by user role */}
      {role === 'NORMAL_USER' && <StoreDiscovery />}
      {role === 'STORE_OWNER' && <OwnerDashboard />}

      {/* Change Password Modal */}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}
