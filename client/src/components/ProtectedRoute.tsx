import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '@store-rating/shared';
import { useAppSelector } from '@/app/hooks';

interface ProtectedRouteProps {
  /** If provided, only users with one of these roles can access the route */
  allowedRoles?: UserRole[];
  /** Where to redirect unauthorized users (default: /login) */
  redirectTo?: string;
}

/**
 * Route guard component that protects routes requiring authentication.
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   <Route element={<ProtectedRoute allowedRoles={['SYSTEM_ADMIN']} />}>
 *     <Route path="/admin" element={<Admin />} />
 *   </Route>
 */
export function ProtectedRoute({ allowedRoles, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, user, isInitializing } = useAppSelector((s) => s.auth);

  // Don't render anything while we're checking the session cookie on first load
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
