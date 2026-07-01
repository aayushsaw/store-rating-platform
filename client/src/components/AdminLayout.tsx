import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Store, LogOut, Star, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logoutThunk } from '@/features/auth/authSlice';
import { useState } from 'react';

export function AdminLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await dispatch(logoutThunk());
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: location.pathname === '/admin',
    },
    {
      label: 'Users',
      path: '/admin/users',
      icon: <Users className="h-4 w-4" />,
      active: location.pathname === '/admin/users',
    },
    {
      label: 'Stores',
      path: '/admin/stores',
      icon: <Store className="h-4 w-4" />,
      active: location.pathname === '/admin/stores',
    },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-150 font-sans selection:bg-indigo-500/20 selection:text-indigo-200">
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-[#1f1f23] bg-[#0c0c0e] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Section */}
          <div className="flex h-14 items-center gap-2.5 px-6 border-b border-[#1f1f23]/60">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/20">
              <Star className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            <span className="text-xs font-bold tracking-tight text-zinc-100 uppercase">
              RateStore Admin
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  item.active
                    ? 'bg-[#18181b] text-indigo-400 border border-[#1f1f23]/60 shadow-sm'
                    : 'text-zinc-400 hover:bg-[#18181b]/50 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <span
                  className={`transition-colors duration-150 ${item.active ? 'text-indigo-400' : 'text-zinc-500'}`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* User profile & Logout (Clerk style) */}
        <div className="p-4 border-t border-[#1f1f23]/60 space-y-3 bg-[#09090b]/40">
          <div className="flex items-center gap-3 px-1.5 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-[#1f1f23] text-zinc-300 font-bold text-xs shadow-inner">
              {user?.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-zinc-200 truncate leading-none">
                {user?.name}
              </p>
              <p className="text-[10px] text-zinc-500 truncate mt-1 leading-none">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/5 hover:text-red-300 rounded-lg transition-colors border border-transparent hover:border-red-500/10"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-[#1f1f23] bg-[#0c0c0e] flex items-center justify-between px-8 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <span>Admin</span>
            <span className="text-zinc-650">/</span>
            <span className="text-zinc-200 capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[10px] font-bold tracking-wide text-amber-400 uppercase">
              <User className="h-3 w-3 shrink-0" />
              SYSTEM_ADMIN
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 noise p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
