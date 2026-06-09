import { Link, useLocation, useNavigate } from 'react-router-dom';

import Logo from './Logo.jsx';

const quickLinks = [
  { label: 'Home', sectionId: 'home' },
  { label: 'Shows', sectionId: 'shows' },
  { label: 'Schedule', sectionId: 'schedule' },
  { label: 'My Bookings', to: '/bookings/my' },
  { label: 'Book Tickets', to: '/shows' },
];
const supportLinks = [
  { label: 'Login', to: '/login' },
  { label: 'Register', to: '/register' },
  { label: 'Profile', to: '/profile' },
  { label: 'Support Center', href: 'mailto:support@aquashow.local' },
  { label: 'Contact Us', href: 'mailto:support@aquashow.local' },
  { label: 'FAQs', sectionId: 'shows' },
  { label: 'Terms & Conditions', to: '/' },
];
const socialIcons = ['public', 'photo_camera', 'play_circle'];

function FooterLink({ link, onSectionNavigate }) {
  const className = 'text-left transition hover:text-cyan-200';

  if (link.sectionId) {
    return (
      <button className={className} type="button" onClick={() => onSectionNavigate(link.sectionId)}>
        {link.label}
      </button>
    );
  }

  if (link.to) {
    return (
      <Link className={className} to={link.to}>
        {link.label}
      </Link>
    );
  }

  return (
    <a className={className} href={link.href}>
      {link.label}
    </a>
  );
}

export default function Footer({ compact = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomepageRoute = ['/', '/shows', '/public/shows'].includes(location.pathname);
  const scrollToSection = (sectionId) => {
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const handleSectionNavigate = (sectionId) => {
    if (isHomepageRoute) {
      scrollToSection(sectionId);
      return;
    }

    navigate('/', { state: { scrollTo: sectionId } });
  };

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950 text-cyan-50">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute -bottom-24 left-8 h-64 w-64 rounded-full bg-orange-300/10 blur-3xl" />

      <div
        className={[
          'relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
          compact ? 'py-10' : 'py-16 lg:py-20',
        ].join(' ')}
      >
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <Logo variant="footer" />
            <p className="max-w-sm text-sm leading-6 text-cyan-100/75">
              AquaPulse brings water show discovery, schedules, ticket booking, and guest service workflows into one
              premium water park experience.
            </p>
            <div className="flex gap-3">
              {socialIcons.map((icon) => (
                <a
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/20 hover:text-white"
                  href="/"
                  key={icon}
                  aria-label={`${icon} social link`}
                >
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-white">Quick Links</h2>
            <ul className="space-y-3 text-sm text-cyan-100/75">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} onSectionNavigate={handleSectionNavigate} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-white">Support</h2>
            <ul className="space-y-3 text-sm text-cyan-100/75">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} onSectionNavigate={handleSectionNavigate} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-white">Contact</h2>
            <address className="space-y-3 text-sm not-italic text-cyan-100/75">
              <p className="flex gap-3">
                <span className="material-symbols-outlined text-base text-cyan-200">location_on</span>
                AquaPulse Water Park, Main Lagoon Plaza
              </p>
              <p className="flex gap-3">
                <span className="material-symbols-outlined text-base text-cyan-200">call</span>
                +84 000 000 000
              </p>
              <p className="flex gap-3">
                <span className="material-symbols-outlined text-base text-cyan-200">mail</span>
                support@aquashow.local
              </p>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-cyan-100/60 md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 AquaPulse. Making every splash count.</p>
          <div className="flex gap-6">
            <a className="transition hover:text-white" href="/">
              Privacy Policy
            </a>
            <a className="transition hover:text-white" href="/">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
