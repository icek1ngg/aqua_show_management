import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../features/auth/AuthContext.jsx';
import MainLayout from '../../shared/layouts/MainLayout.jsx';
import ActiveSessionsPanel from './SessionsPage.jsx';

const recentBookings = [
  {
    title: 'Symphony of Lights',
    date: 'Oct 24, 2024 · 8:00 PM',
    tickets: '2 Tickets',
    amount: '4.000 ₫',
    status: 'Paid',
    statusIcon: 'check_circle',
    amountClassName: 'text-cyan-700',
    statusClassName: 'bg-emerald-100 text-emerald-700',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCujaSo6RV1Zoca54QEd2IVZ0mAIhk-vMjIjrWZ7vuCp0P6wllTuqPk4C8vUmNCkvR3RIODJ1oFmeSH8MZ-G37u1qMR5SGvZxUPPJnMsqk3L4KrtxQarbpM4eTByeZzXqJBfd1vj5K372GpP8Ayu4fBjMoU297quKk5Ks1Zu3OJVF7JnLc7tv52VksRq713j_R4nTLp2eF5SXS-k8LDvGqMXUTAVexCDC4W2CRrf9wRyqfIIqm9G3VrZTqy0eU7D4yRB5CiNTWJug',
  },
  {
    title: 'Dolphin Tales',
    date: 'Oct 25, 2024 · 11:00 AM',
    tickets: '1 Ticket',
    amount: '2.000 ₫',
    status: 'Pending Payment',
    statusIcon: 'schedule',
    amountClassName: 'text-orange-600',
    statusClassName: 'bg-orange-100 text-orange-700',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCLkcsyUKlIImgmce-9G2dAo8GcDQHC4tMU_HtQpL0TEZHFnZMA593upxVQv7NP_8xUJLFZ9UhPc2TkLmRBIwG4nADjfrcPCCV1OcprAX9PJYRROaEPTJIr9XSSsURgaOernS9YgRdb06XKur09aBAzonxwlnjCul3WOZ_hy89pXKbtzNbQMxBkKc-JLsrTQN5WL9Qd5ekbJS4-Q_1eRRxp5L5pm-iG_pY2SQwZkYFcKXI6Ead_uy9WTRTwJK2BTK1zLuqph8bxCQ',
  },
];

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

function RecentBookings() {
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
        {recentBookings.map((booking) => (
          <article
            className="group flex flex-col justify-between gap-5 rounded-[1.5rem] border border-cyan-100 p-5 transition hover:border-cyan-300 hover:bg-cyan-50/50 md:flex-row md:items-center md:p-6"
            key={booking.title}
          >
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cyan-50">
                <img alt={booking.title} className="h-full w-full object-cover" src={booking.imageUrl} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black text-slate-900 transition group-hover:text-cyan-800">
                  {booking.title}
                </h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  {booking.date}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-5 md:justify-end">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500">{booking.tickets}</p>
                <p className={`text-lg font-black ${booking.amountClassName}`}>{booking.amount}</p>
              </div>
              <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${booking.statusClassName}`}>
                <span className="material-symbols-outlined text-sm">{booking.statusIcon}</span>
                {booking.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const { user, loading, refreshCurrentUser } = useAuth();

  useEffect(() => {
    if (!user && !loading) {
      refreshCurrentUser();
    }
  }, [user, loading, refreshCurrentUser]);

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
          <RecentBookings />
        </section>
      </div>
    </MainLayout>
  );
}
