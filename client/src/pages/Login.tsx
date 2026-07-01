import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Star } from 'lucide-react';
import { useState } from 'react';
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
    <div className="flex min-h-screen bg-zinc-950">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 border-r border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
            <Star className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-100">RateStore</span>
        </div>

        <div className="space-y-6">
          <blockquote className="space-y-4">
            <p className="text-2xl font-light leading-relaxed text-zinc-200">
              &ldquo;Real ratings from real customers — the most honest signal for any
              business.&rdquo;
            </p>
            <footer className="text-sm text-zinc-500">Store Rating Platform</footer>
          </blockquote>

          <div className="flex gap-8 pt-4">
            {[
              { label: 'Stores', value: '2,400+' },
              { label: 'Ratings', value: '18k+' },
              { label: 'Users', value: '5,200+' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-2xl font-bold gradient-text">{value}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-600">© 2025 RateStore. All rights reserved.</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <Star className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-zinc-100">RateStore</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Welcome back</h1>
            <p className="mt-1.5 text-sm text-zinc-500">Sign in to your account to continue.</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="alert-error" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="label">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
                {...register('email')}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
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
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
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

            <button id="login-submit" type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
