import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../features/auth/AuthContext.jsx';
import CartBadge from '../../../features/cart/CartBadge.jsx';
import Logo from './Logo.jsx';
import TicketSearchDrawer from './TicketSearchDrawer.jsx';
import { canShowUserCart } from './navbarCartEligibility.js';

const sectionNavigationLinks = [
  { label: 'Home', sectionId: 'home' },
  { label: 'Shows', sectionId: 'shows' },
  { label: 'Schedule', sectionId: 'schedule' },
];

const routeNavigationLinks = [
  { label: 'My Bookings', to: '/bookings/my' },
];

const defaultMockUser = {
  name: 'Marina Waters',
  email: 'marina.waters@gmail.com',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBr1y6jT8rVNkVdiy8aMYObXvdvRyko9uO4Dlz5RNeuhycjQ0DbT_Gii4DoZSNhJ8fzz3fc1uky7EYTIVukTsWQ1lMjOG0NLWSobI9K8tEZhM2tmkt55Hipfh7jRFPvNsV1FKCPz5cLjRmjD0N_d6fD2WXkrrKzSk3CdC7Mb53gVjPueoFIiAJEoiCwB7Dg8JEjusemuC7MWfmkC5xv1zbTMQLL1NoTs4RPgoqG0-QcV07o36TcnAwUbaAvzveKsMYqzBsz_ph3SQ',
};

function UserAvatar({ user, className = 'h-9 w-9' }) {
  if (user?.avatarUrl) {
    return (
      <img
        alt={`${user.name || 'AquaPulse user'} avatar`}
        className={`${className} rounded-full border-2 border-cyan-300 object-cover`}
        src={user.avatarUrl}
      />
    );
  }

  return (
    <span className={`${className} flex items-center justify-center rounded-full border-2 border-cyan-300 bg-cyan-100 text-sm font-black text-cyan-800`}>
      {(user?.fullName || user?.name || user?.email || 'A').charAt(0).toUpperCase()}
    </span>
  );
}

function hasRole(user, role) {
  const roles = [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])]
    .filter(Boolean)
    .map((value) => String(value).replace(/^ROLE_/, '').toUpperCase());
  return roles.includes(role);
}

function NavLinks({ onNavigate, onSectionNavigate, user }) {
  const links = hasRole(user, 'STAFF')
    ? [...routeNavigationLinks, { label: 'Check-in', to: '/staff/check-in' }]
    : routeNavigationLinks;

  const buttonClassName = 'rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-800';

  return (
    <>
      {sectionNavigationLinks.map((link) => (
        <button
          className={buttonClassName}
          key={link.label}
          type="button"
          onClick={() => onSectionNavigate(link.sectionId)}
        >
          {link.label}
        </button>
      ))}
      {links.map((link) => (
        <NavLink
          className={({ isActive }) =>
            [
              'rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-cyan-50 hover:text-cyan-800',
              isActive ? 'bg-cyan-50 text-cyan-800' : 'text-slate-600',
            ].join(' ')
          }
          key={link.label}
          onClick={onNavigate}
          to={link.to}
        >
          {link.label}
        </NavLink>
      ))}
    </>
  );
}

function LoggedOutActions() {
  return (
    <Link
      className="flex items-center gap-2 rounded-full border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-500 hover:bg-cyan-50"
      to="/login"
    >
      <span className="material-symbols-outlined text-base">login</span>
      Sign In
    </Link>
  );
}

function LoggedInActions({ user, onLogout }) {
  const displayUser = user || defaultMockUser;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const displayEmail = displayUser.email || displayUser.gmail || displayUser.name || defaultMockUser.email;
  const isStaff = hasRole(displayUser, 'STAFF');

  useEffect(() => {
    if (!isDropdownOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isDropdownOpen]);

  const handleLogoutClick = async () => {
    setIsDropdownOpen(false);
    await onLogout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-3 rounded-full bg-white/70 py-1.5 pl-1.5 pr-3 shadow-sm ring-1 ring-cyan-100 transition hover:bg-cyan-50 hover:ring-cyan-200"
        type="button"
        aria-expanded={isDropdownOpen}
        aria-haspopup="menu"
        onClick={() => setIsDropdownOpen((current) => !current)}
      >
        <UserAvatar user={displayUser} />
        <span className="hidden max-w-[180px] truncate text-sm font-semibold text-slate-700 lg:inline">{displayEmail}</span>
        <span className="material-symbols-outlined text-base text-cyan-700">expand_more</span>
      </button>

      {isDropdownOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-cyan-100 bg-white p-2 shadow-xl shadow-cyan-950/10"
          role="menu"
        >
          {!isStaff ? (
            <Link
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-800"
              role="menuitem"
              to="/profile"
              onClick={() => setIsDropdownOpen(false)}
            >
              <span className="material-symbols-outlined text-lg text-cyan-700">person</span>
              Profile
            </Link>
          ) : null}
          <button
            className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-700"
            role="menuitem"
            type="button"
            onClick={handleLogoutClick}
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);
  const [isTicketDrawerOpen, setIsTicketDrawerOpen] = useState(false);
  const isStaff = hasRole(user, 'STAFF');
  const canShowCart = canShowUserCart(user, loading);

  useEffect(() => {
    const handleOpenDrawer = () => {
      setIsTicketDrawerOpen(true);
    };
    window.addEventListener('aquapulse:open-ticket-drawer', handleOpenDrawer);
    return () => window.removeEventListener('aquapulse:open-ticket-drawer', handleOpenDrawer);
  }, []);

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
    setIsMobileUserMenuOpen(false);
  };
  const openTicketDrawer = () => {
    setIsMobileOpen(false);
    setIsTicketDrawerOpen(true);
  };
  const closeTicketDrawer = () => setIsTicketDrawerOpen(false);
  const isHomepageRoute = ['/', '/shows', '/public/shows'].includes(location.pathname);
  const scrollToSection = (sectionId) => {
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const handleSectionNavigate = (sectionId) => {
    closeMobileMenu();

    if (isHomepageRoute) {
      scrollToSection(sectionId);
      return;
    }

    navigate('/', { state: { scrollTo: sectionId } });
  };
  const handleLogout = async () => {
    await logout();
    setIsMobileOpen(false);
    setIsMobileUserMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-cyan-100/70 bg-white/80 shadow-[0_8px_32px_rgba(14,116,144,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-2 md:flex" aria-label="Primary navigation">
            <NavLinks onSectionNavigate={handleSectionNavigate} user={user} />
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            {canShowCart ? <CartBadge /> : null}
            {isAuthenticated ? <LoggedInActions user={user} onLogout={handleLogout} /> : !loading && <LoggedOutActions />}
            {!isStaff ? (
              <button
                className="rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:-translate-y-0.5 hover:shadow-cyan-700/30 active:translate-y-0"
                type="button"
                onClick={openTicketDrawer}
              >
                Book Now
              </button>
            ) : null}
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
              <NavLinks onNavigate={closeMobileMenu} onSectionNavigate={handleSectionNavigate} user={user} />
            </nav>

            <div className="mt-4 flex flex-col gap-3 border-t border-cyan-100 pt-4">
              {canShowCart ? (
                <CartBadge className="self-end" onClick={closeMobileMenu} />
              ) : null}
              {isAuthenticated ? (
                <>
                  <button
                    className="flex w-full items-center gap-3 rounded-2xl bg-cyan-50 p-3 text-left"
                    type="button"
                    aria-expanded={isMobileUserMenuOpen}
                    aria-haspopup="menu"
                    onClick={() => setIsMobileUserMenuOpen((current) => !current)}
                  >
                    <UserAvatar user={user || defaultMockUser} className="h-10 w-10" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                      {user?.email || user?.gmail || user?.name || defaultMockUser.email}
                    </span>
                    <span className="material-symbols-outlined text-base text-cyan-700">expand_more</span>
                  </button>
                  {isMobileUserMenuOpen && (
                    <div className="rounded-2xl border border-cyan-100 bg-white p-2 shadow-lg" role="menu">
                      {!isStaff ? (
                        <Link
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-cyan-50"
                          role="menuitem"
                          to="/profile"
                          onClick={closeMobileMenu}
                        >
                          <span className="material-symbols-outlined text-lg text-cyan-700">person</span>
                          Profile
                        </Link>
                      ) : null}
                      <button
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700"
                        role="menuitem"
                        type="button"
                        onClick={handleLogout}
                      >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : !loading ? (
                <div>
                  <Link
                    className="flex items-center justify-center gap-2 rounded-full border border-cyan-100 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-cyan-500 hover:bg-cyan-50"
                    to="/login"
                    onClick={closeMobileMenu}
                  >
                    <span className="material-symbols-outlined text-base">login</span>
                    Sign In
                  </Link>
                </div>
              ) : null}
              {!isStaff ? (
                <button
                  className="rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-700 px-5 py-3 text-center text-sm font-bold text-white shadow-lg shadow-cyan-700/20"
                  type="button"
                  onClick={openTicketDrawer}
                >
                  Book Now
                </button>
              ) : null}
            </div>
          </div>
        )}
      </header>

      {!isStaff ? <TicketSearchDrawer open={isTicketDrawerOpen} onClose={closeTicketDrawer} /> : null}
    </>
  );
}
