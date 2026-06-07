import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/AuthContext.jsx';
import Logo from '../components/navigation/Logo.jsx';

export default function StaffLayout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.fullName || user?.name || user?.email || 'Staff';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-cyan-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-black text-slate-800">{displayName}</p>
              <p className="text-xs font-semibold text-cyan-700">QR Check-in</p>
            </div>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-50"
              onClick={handleLogout}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Logout
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
