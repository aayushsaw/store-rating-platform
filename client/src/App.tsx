import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { checkAuth } from '@/features/auth/authSlice';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { DashboardPlaceholder } from '@/pages/DashboardPlaceholder';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { UserManagement } from '@/pages/admin/UserManagement';
import { StoreManagement } from '@/pages/admin/StoreManagement';
import { UserRole } from '@store-rating/shared';

function AppRoutes() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Attempt to silently restore session on every cold start
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Routes>
      {/* ── Public routes ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ── Protected routes ── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPlaceholder />} />
      </Route>

      {/* ── Admin routes ── */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.SYSTEM_ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/stores" element={<StoreManagement />} />
        </Route>
      </Route>

      {/* ── Unauthorized ── */}
      <Route
        path="/unauthorized"
        element={
          <div className="flex min-h-screen items-center justify-center bg-zinc-950">
            <div className="text-center space-y-3">
              <p className="text-4xl font-bold text-zinc-700">403</p>
              <p className="text-sm text-zinc-500">You don&apos;t have access to this page.</p>
              <a href="/" className="inline-block text-sm text-indigo-400 hover:text-indigo-300">
                Go home &rarr;
              </a>
            </div>
          </div>
        }
      />

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
