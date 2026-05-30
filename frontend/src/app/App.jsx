import { NavLink, Outlet } from 'react-router-dom';

const navLinkClass = ({ isActive }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-cyan-700 text-white'
      : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-800',
  ].join(' ');

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-lg font-semibold text-cyan-800">ASMS</p>
            <p className="text-xs text-slate-500">AquaShow Management System</p>
          </div>

          <nav className="flex items-center gap-2" aria-label="Primary navigation">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/health" className={navLinkClass}>
              Health
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
