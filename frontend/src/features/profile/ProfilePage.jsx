import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../features/auth/AuthContext.jsx';
import { getMyBookings } from '../../services/bookingService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';
import { formatCurrency } from '../../shared/utils/ticketPricing.js';
import ActiveSessionsPanel from './SessionsPage.jsx';

const fallbackBookingImage = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=320&q=80';

function ProfileAvatar({ user }) {
  if (user.avatarUrl) {
    return <img alt="Profile avatar" className="h-full w-full object-cover" src={user.avatarUrl} />;
  }

  return (
    <span className="flex h-full w-full items-center justify-center bg-cyan-100 text-4xl font-black uppercase text-cyan-800">
      {(user.fullName || user.email || 'A').charAt(0)}
    </span>
  );
}

function ProfileSummaryCard({ user }) {
  const displayCreated = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Not provided';
  const displayProvider = user.authProvider === 'GOOGLE' ? 'Google' : 'Email & password';

  const details = [
    { icon: 'location_on', label: 'Location', value: user.address || 'Not provided' },
    { icon: 'calendar_month', label: 'Member since', value: displayCreated },
    { icon: 'verified_user', label: 'Signed in with', value: displayProvider },
  ];

  return (
    <section className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_12px_40px_rgba(8,145,178,0.08)] sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-cyan-50 bg-white shadow-lg">
            <ProfileAvatar user={user} />
          </div>
          <span className="absolute right-[-12px] top-2 flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-2 py-1 text-[11px] font-bold text-emerald-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-950">{user.fullName}</h1>
          <span className="rounded-md bg-cyan-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-800">
            {user.role}
          </span>
        </div>
        <p className="mt-2 max-w-full truncate text-sm text-slate-500">{user.email}</p>

        <Link
          className="mt-6 w-full rounded-full border border-cyan-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-800"
          to="/profile/edit"
        >
          Edit Profile
        </Link>
      </div>

      <dl className="mt-7 space-y-4 border-t border-cyan-100 pt-6">
        {details.map((detail) => (
          <div className="flex items-start justify-between gap-4 text-sm" key={detail.label}>
            <dt className="flex shrink-0 items-center gap-2 text-slate-500">
              <span className="material-symbols-outlined text-lg text-cyan-700">{detail.icon}</span>
              {detail.label}
            </dt>
            <dd className="min-w-0 text-right font-bold text-slate-800">{detail.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function bookingStatusMeta(status) {
  if (status === 'PAID') return { label: 'Paid', icon: 'check_circle', className: 'bg-emerald-100 text-emerald-700' };
  if (status === 'FAILED') return { label: 'Failed', icon: 'error', className: 'bg-red-100 text-red-700' };
  if (status === 'EXPIRED') return { label: 'Expired', icon: 'timer_off', className: 'bg-slate-100 text-slate-600' };
  return { label: 'Pending Payment', icon: 'schedule', className: 'bg-orange-100 text-orange-700' };
}

function formatBookingDate(value) {
  if (!value) return 'Schedule unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function RecentBookings({ bookings, isLoading, error }) {
  return (
    <section className="rounded-[2rem] border border-cyan-100 bg-white p-5 shadow-[0_12px_40px_rgba(8,145,178,0.08)] sm:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Your activity</p>
          <h2 className="text-2xl font-black text-slate-950">Recent Bookings</h2>
        </div>
        <Link className="text-sm font-bold text-cyan-700 underline-offset-4 hover:underline" to="/bookings/my">
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {isLoading ? <p className="py-10 text-center font-semibold text-cyan-700">Loading recent bookings...</p> : null}
        {!isLoading && error ? <p className="rounded-2xl bg-red-50 p-5 text-center font-semibold text-red-700">{error}</p> : null}
        {!isLoading && !error && bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cyan-200 p-8 text-center">
            <p className="font-bold text-slate-700">You have no bookings yet.</p>
            <Link className="mt-3 inline-block font-bold text-cyan-700 hover:underline" to="/">Explore shows</Link>
          </div>
        ) : null}
        {!isLoading && !error ? bookings.map((booking) => {
          const firstItem = booking.items?.[0];
          const meta = bookingStatusMeta(booking.status);
          const title = firstItem?.showName || booking.showName || 'AquaPulse Show';
          return (
          <article
            className="group flex flex-col justify-between gap-5 rounded-[1.5rem] border border-cyan-100 p-5 transition hover:border-cyan-300 hover:bg-cyan-50/50 md:flex-row md:items-center md:p-6"
            key={booking.id}
          >
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cyan-50">
                <img alt={title} className="h-full w-full object-cover" src={firstItem?.imageUrl || fallbackBookingImage} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black text-slate-900 transition group-hover:text-cyan-800">
                  {title}
                </h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  {formatBookingDate(firstItem?.startTime || booking.showDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-5 md:justify-end">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500">{booking.totalQuantity ?? booking.quantity ?? 0} Tickets</p>
                <p className="text-lg font-black text-cyan-700">{formatCurrency(booking.totalAmount)}</p>
              </div>
              <Link className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${meta.className}`} to={`/bookings/${booking.id}`}>
                <span className="material-symbols-outlined text-sm">{meta.icon}</span>
                {meta.label}
              </Link>
            </div>
          </article>
          );
        }) : null}
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const { user, loading, refreshCurrentUser } = useAuth();
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState('');

  useEffect(() => {
    if (!user && !loading) {
      refreshCurrentUser();
    }
  }, [user, loading, refreshCurrentUser]);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    setRecentLoading(true);
    setRecentError('');
    getMyBookings({ page: 0, size: 2 })
      .then((response) => {
        if (active) setRecentBookings(Array.isArray(response?.items) ? response.items : []);
      })
      .catch(() => {
        if (active) setRecentError('Could not load recent bookings.');
      })
      .finally(() => {
        if (active) setRecentLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  if (loading || !user) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-700 border-t-transparent" />
          <p className="text-sm font-semibold text-cyan-800">Loading your profile...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8 lg:py-12">
        <aside className="space-y-6">
          <ProfileSummaryCard user={user} />
          <ActiveSessionsPanel />
        </aside>

        <section className="min-w-0" aria-label="Profile activity">
          <RecentBookings bookings={recentBookings} error={recentError} isLoading={recentLoading} />
        </section>
      </div>
    </MainLayout>
  );
}
