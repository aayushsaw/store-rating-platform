import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info, Loader2, Star } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@store-rating/shared';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { registerThunk, clearError } from '@/features/auth/authSlice';

export function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const passwordValue = watch('password', '');

  const passwordChecks = [
    { label: '8–16 characters', pass: passwordValue.length >= 8 && passwordValue.length <= 16 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(passwordValue) },
    {
      label: 'One special character',
      pass: /[!@#$%^&*()_+\-={};':"\\|,.<>/?]/.test(passwordValue),
    },
  ];

  const onSubmit = async (data: RegisterInput) => {
    const result = await dispatch(registerThunk(data));
    if (registerThunk.fulfilled.match(result)) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    }
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

        <div className="space-y-5">
          <h2 className="text-xl font-light leading-relaxed text-zinc-200">
            Join thousands of customers shaping the future of retail.
          </h2>
          <ul className="space-y-3.5">
            {[
              "Rate stores you've visited",
              'Help businesses improve their service',
              'Build trust in your community',
            ].map((text) => (
              <li key={text} className="flex items-center gap-2.5 text-xs text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[10px] text-zinc-650 font-semibold uppercase tracking-wider">
          © 2026 RateStore. All rights reserved.
        </p>
      </div>

      {/* ── Right Panel (Clerk-style Form) ── */}
      <div className="flex w-full items-start justify-center overflow-y-auto px-6 py-12 lg:w-1/2">
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
            <h1 className="text-lg font-bold tracking-tight text-zinc-150">Create account</h1>
            <p className="mt-1 text-xs text-zinc-550">Get started — it only takes a minute.</p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="alert-success" role="alert">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Account created! Redirecting you to login…</span>
            </div>
          )}

          {/* Error Banner */}
          {error && !success && (
            <div className="alert-error" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="reg-name" className="label">
                  Full name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alexander Montgomery Smith"
                  className={`input text-xs ${errors.name ? 'input-error' : ''}`}
                  {...register('name')}
                />
                {errors.name ? (
                  <p className="field-error">{errors.name.message}</p>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-650">
                    <Info className="h-3.5 w-3.5" />
                    Minimum 20 characters required.
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="label">
                  Email address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`input text-xs ${errors.email ? 'input-error' : ''}`}
                  {...register('email')}
                />
                {errors.email && <p className="field-error">{errors.email.message}</p>}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="reg-address" className="label">
                  Address
                </label>
                <input
                  id="reg-address"
                  type="text"
                  autoComplete="street-address"
                  placeholder="123 Main Street, Springfield, IL 62701"
                  className={`input text-xs ${errors.address ? 'input-error' : ''}`}
                  {...register('address')}
                />
                {errors.address && <p className="field-error">{errors.address.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
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

                {/* Password strength indicators */}
                {passwordValue.length > 0 && (
                  <ul className="mt-2.5 space-y-1.5 border-t border-[#1f1f23]/60 pt-2 animate-scale-in">
                    {passwordChecks.map(({ label, pass }) => (
                      <li key={label} className="flex items-center gap-1.5 text-[10px]">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${pass ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        />
                        <span className={pass ? 'text-zinc-405 font-medium' : 'text-zinc-600'}>
                          {label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {errors.password && <p className="field-error">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-xs mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Registering…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-zinc-550 border-t border-[#1f1f23]/60 pt-4.5">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
