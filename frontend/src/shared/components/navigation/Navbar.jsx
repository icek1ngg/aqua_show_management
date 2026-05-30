import { useState } from 'react';

import Logo from './Logo.jsx';

const navigationLinks = [
  { label: 'Home', href: '#' },
  { label: 'Shows', href: '#' },
  { label: 'Schedules', href: '#' },
  { label: 'My Bookings', href: '#' },
];

const defaultMockUser = {
  name: 'Marina Waters',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBr1y6jT8rVNkVdiy8aMYObXvdvRyko9uO4Dlz5RNeuhycjQ0DbT_Gii4DoZSNhJ8fzz3fc1uky7EYTIVukTsWQ1lMjOG0NLWSobI9K8tEZhM2tmkt55Hipfh7jRFPvNsV1FKCPz5cLjRmjD0N_d6fD2WXkrrKzSk3CdC7Mb53gVjPueoFIiAJEoiCwB7Dg8JEjusemuC7MWfmkC5xv1zbTMQLL1NoTs4RPgoqG0-QcV07o36TcnAwUbaAvzveKsMYqzBsz_ph3SQ',
};

function NavLinks({ onNavigate }) {
  return (
    <>
      {navigationLinks.map((link) => (
        <a
          className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-800"
          href={link.href}
          key={link.label}
          onClick={onNavigate}
        >
          {link.label}
        </a>
      ))}
    </>
  );
}

function LoggedOutActions() {
  return (
    <>
      <a className="text-sm font-semibold text-slate-600 transition hover:text-cyan-800" href="#">
        Login
      </a>
      <a
        className="rounded-full border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-500 hover:bg-cyan-50"
        href="#"
      >
        Register
      </a>
    </>
  );
}

function LoggedInActions({ user }) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-3 rounded-full bg-white/70 py-1.5 pl-1.5 pr-4 shadow-sm ring-1 ring-cyan-100 lg:flex">
        <img
          alt={`${user.name} avatar`}
          className="h-9 w-9 rounded-full border-2 border-cyan-300 object-cover"
          src={user.avatarUrl}
        />
        <span className="text-sm font-semibold text-slate-700">{user.name}</span>
      </div>
      <a className="hidden text-sm font-semibold text-slate-600 transition hover:text-cyan-800 md:inline" href="#">
        Profile
      </a>
      <button className="hidden text-sm font-semibold text-slate-500 transition hover:text-[#ff6900] md:inline" type="button">
        Logout
      </button>
    </div>
  );
}

export default function Navbar({ isLoggedIn = false, user = defaultMockUser }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-100/70 bg-white/80 shadow-[0_8px_32px_rgba(14,116,144,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-2 md:flex" aria-label="Primary navigation">
          <NavLinks />
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {isLoggedIn ? <LoggedInActions user={user} /> : <LoggedOutActions />}
          <a
            className="rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:-translate-y-0.5 hover:shadow-cyan-700/30 active:translate-y-0"
            href="#"
          >
            Book Now
          </a>
        </div>

        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-100 bg-white/80 text-cyan-800 shadow-sm transition hover:bg-cyan-50 md:hidden"
          type="button"
          aria-expanded={isMobileOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setIsMobileOpen((current) => !current)}
        >
          <span className="material-symbols-outlined">{isMobileOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {isMobileOpen && (
        <div className="border-t border-cyan-100 bg-white/95 px-4 py-4 shadow-xl backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            <NavLinks onNavigate={closeMobileMenu} />
          </nav>

          <div className="mt-4 flex flex-col gap-3 border-t border-cyan-100 pt-4">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-3 rounded-2xl bg-cyan-50 p-3">
                  <img alt={`${user.name} avatar`} className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl} />
                  <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                </div>
                <a className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-cyan-50" href="#">
                  Profile
                </a>
                <button className="rounded-full px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-cyan-50" type="button">
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <a className="rounded-full border border-cyan-100 px-4 py-2 text-center text-sm font-semibold text-slate-700" href="#">
                  Login
                </a>
                <a className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-center text-sm font-semibold text-cyan-800" href="#">
                  Register
                </a>
              </div>
            )}
            <a
              className="rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-700 px-5 py-3 text-center text-sm font-bold text-white shadow-lg shadow-cyan-700/20"
              href="#"
            >
              Book Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
