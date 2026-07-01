import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Star } from 'lucide-react';
import { loginSchema, type LoginInput } from '@store-rating/shared';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loginThunk, clearError } from '@/features/auth/authSlice';

export function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const onSubmit = (data: LoginInput) => {
    dispatch(loginThunk(data));
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 font-sans selection:bg-indigo-500/20 selection:text-indigo-200 animate-fade-in">
      {/* ── Left Panel (Arc/Linear styled banner) ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 border-r border-[#1f1f23]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-650 shadow-md shadow-indigo-650/20">
            <Star className="h-3.5 w-3.5 text-white fill-white" />
          </div>
          <span className="text-xs font-bold tracking-tight text-zinc-100 uppercase">
            RateStore
          </span>
        </div>

        <div className="space-y-6">
          <blockquote className="space-y-4">
            <p className="text-xl font-light leading-relaxed text-zinc-200">
              &ldquo;Real ratings from real customers — the most honest signal for any
              business.&rdquo;
            </p>
            <footer className="text-xs text-zinc-550">Store Rating Platform</footer>
          </blockquote>

          <div className="flex gap-8 pt-4 border-t border-[#1f1f23]/60 max-w-sm">
            {[
              { label: 'Stores', value: '2,400+' },
              { label: 'Ratings', value: '18k+' },
              { label: 'Users', value: '5,200+' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xl font-bold text-zinc-150 tracking-tight">{value}</p>
                <p className="mt-0.5 text-[10px] text-zinc-550 font-semibold uppercase tracking-wider">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-zinc-650 font-semibold uppercase tracking-wider">
          © 2026 RateStore. All rights reserved.
        </p>
      </div>

      {/* ── Right Panel (Clerk-style Form) ── */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm space-y-7 animate-scale-in">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <Star className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            <span className="text-xs font-bold tracking-tight text-zinc-100 uppercase">
              RateStore
            </span>
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-150">Welcome back</h1>
            <p className="mt-1 text-xs text-zinc-550">Sign in to your account to continue.</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="alert-error" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4.5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="label">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className={`input text-xs ${errors.email ? 'input-error' : ''}`}
                {...register('email')}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-password" className="label mb-0">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`input text-xs pr-10 ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-xs">
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-550 border-t border-[#1f1f23]/60 pt-4.5">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
