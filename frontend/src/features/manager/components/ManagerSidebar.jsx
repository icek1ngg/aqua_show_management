import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext.jsx';

const managerNavItems = [
  { to: '/manager/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/manager/shows', icon: 'theater_comedy', label: 'Shows' },
  { to: '/manager/schedules', icon: 'calendar_month', label: 'Show Schedules' },
  { to: '/manager/bookings', icon: 'event_seat', label: 'Bookings' },
  { to: '/manager/reports', icon: 'analytics', label: 'Reports' },
];

export default function ManagerSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-sidebar-width flex-col bg-on-secondary-fixed py-unit-lg shadow-lg">
      <div className="mb-unit-xl px-unit-lg">
        <h1 className="font-headline-md text-headline-md font-bold text-primary-fixed">AquaShow MS</h1>
        <p className="font-body-md text-body-md text-primary-fixed/70">Manager Workspace</p>
      </div>

      <nav className="flex flex-1 flex-col gap-unit-xs">
        {managerNavItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) => [
              'flex items-center gap-unit-md px-unit-lg py-unit-md transition-all',
              isActive
                ? 'border-l-4 border-primary-fixed bg-on-secondary-fixed-variant/30 text-primary-fixed'
                : 'text-on-secondary-fixed-variant hover:bg-on-secondary-fixed-variant/20 hover:text-primary-fixed',
            ].join(' ')}
            to={item.to}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-body-md text-body-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-on-secondary-fixed-variant/10 px-unit-lg pt-unit-lg">
        <button
          className="flex w-full items-center justify-center gap-unit-sm rounded-lg border border-primary-fixed/30 px-unit-md py-unit-md font-label-lg text-primary-fixed transition-all hover:bg-on-secondary-fixed-variant/20 active:scale-[0.98]"
          type="button"
          onClick={handleLogout}
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
