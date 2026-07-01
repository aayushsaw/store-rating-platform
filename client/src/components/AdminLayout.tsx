import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Store, LogOut, Star, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logoutThunk } from '@/features/auth/authSlice';

export function AdminLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
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
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex h-14 items-center gap-3 px-6 border-b border-zinc-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 shadow-lg shadow-indigo-600/30">
              <Star className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              RateStore Admin
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                  item.active
                    ? 'bg-zinc-900 text-indigo-400 border border-zinc-800'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-zinc-900 space-y-3 bg-zinc-950/50">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-sm">
              {user?.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/5 hover:text-red-300 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Admin</span>
            <span>/</span>
            <span className="text-zinc-200 capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-400">
              <User className="h-3 w-3" />
              SYSTEM_ADMIN
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 noise p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
