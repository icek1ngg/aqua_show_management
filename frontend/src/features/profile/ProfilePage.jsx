import { useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import MainLayout from '../../shared/layouts/MainLayout.jsx';

const bookingStats = [
  { label: 'Total Bookings', value: '12', className: 'text-cyan-700' },
  { label: 'Pending', value: '1', className: 'text-[#ff6900]' },
  { label: 'Active', value: '3', className: 'text-teal-700' },
  { label: 'Completed', value: '8', className: 'text-emerald-600' },
];

const quickActions = [
  {
    label: 'Book New Ticket',
    icon: 'confirmation_number',
    className: 'text-cyan-700 hover:bg-cyan-50',
    iconClassName: 'bg-cyan-100 text-cyan-700',
    to: '/bookings/create',
  },
  {
    label: 'View Available Shows',
    icon: 'event',
    className: 'text-teal-700 hover:bg-teal-50',
    iconClassName: 'bg-teal-100 text-teal-700',
    to: '/',
  },
];

const recentBookings = [
  {
    title: 'Symphony of Lights',
    date: 'Oct 24, 2024 - 8:00 PM',
    tickets: '2 Tickets',
    amount: '4.000 ₫',
    status: 'Paid',
    statusIcon: 'check_circle',
    accentClassName: 'text-cyan-700 group-hover:text-cyan-800',
    amountClassName: 'text-cyan-700',
    statusClassName: 'bg-emerald-100 text-emerald-700',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCujaSo6RV1Zoca54QEd2IVZ0mAIhk-vMjIjrWZ7vuCp0P6wllTuqPk4C8vUmNCkvR3RIODJ1oFmeSH8MZ-G37u1qMR5SGvZxUPPJnMsqk3L4KrtxQarbpM4eTByeZzXqJBfd1vj5K372GpP8Ayu4fBjMoU297quKk5Ks1Zu3OJVF7JnLc7tv52VksRq713j_R4nTLp2eF5SXS-k8LDvGqMXUTAVexCDC4W2CRrf9wRyqfIIqm9G3VrZTqy0eU7D4yRB5CiNTWJug',
  },
  {
    title: 'Dolphin Tales',
    date: 'Oct 25, 2024 - 11:00 AM',
    tickets: '1 Ticket',
    amount: '2.000 ₫',
    status: 'Pending Payment',
    statusIcon: 'schedule',
    accentClassName: 'text-[#ff6900] group-hover:text-orange-700',
    amountClassName: 'text-[#ff6900]',
    statusClassName: 'bg-orange-100 text-[#ff6900]',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCLkcsyUKlIImgmce-9G2dAo8GcDQHC4tMU_HtQpL0TEZHFnZMA593upxVQv7NP_8xUJLFZ9UhPc2TkLmRBIwG4nADjfrcPCCV1OcprAX9PJYRROaEPTJIr9XSSsURgaOernS9YgRdb06XKur09aBAzonxwlnjCul3WOZ_hy89pXKbtzNbQMxBkKc-JLsrTQN5WL9Qd5ekbJS4-Q_1eRRxp5L5pm-iG_pY2SQwZkYFcKXI6Ead_uy9WTRTwJK2BTK1zLuqph8bxCQ',
  },
];

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
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-700 border-t-transparent" />
          <p className="text-sm font-semibold text-cyan-800">Loading your profile...</p>
        </div>
      </MainLayout>
    );
  }

  const displayPhone = user.phoneNumber || 'Not provided';
  const displayGender = user.gender ? (user.gender.charAt(0) + user.gender.slice(1).toLowerCase()) : 'Not provided';
  const displayDob = user.dateOfBirth || 'Not provided';
  const displayProvider = user.authProvider === 'GOOGLE' ? 'Google Account' : 'Local Account';
  const displayCreated = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not provided';

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <header className="relative mb-12 flex min-h-[300px] flex-col justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-500 via-teal-600 to-cyan-900 px-6 py-10 shadow-2xl shadow-cyan-950/20 md:px-10">
          <div className="absolute left-[12%] top-10 h-6 w-6 rounded-full bg-white/20" />
          <div className="absolute left-[28%] bottom-16 h-12 w-12 rounded-full bg-white/15" />
          <div className="absolute right-[16%] top-20 h-20 w-20 rounded-full bg-cyan-200/10" />
          <div className="absolute -bottom-24 right-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <svg className="absolute bottom-0 left-0 h-28 w-full text-white/10" fill="none" preserveAspectRatio="none" viewBox="0 0 1440 120" aria-hidden="true">
            <path
              d="M0 120L48 110C96 100 192 80 288 75C384 70 480 80 576 85C672 90 768 90 864 80C960 70 1056 50 1152 45C1248 40 1344 50 1392 55L1440 60V120H0Z"
              fill="currentColor"
            />
            <path
              d="M0 80L48 83.3C96 86.7 192 93.3 288 90C384 86.7 480 73.3 576 70C672 66.7 768 73.3 864 80C960 86.7 1056 93.3 1152 90C1248 86.7 1344 73.3 1392 66.7L1440 60V120H0Z"
              fill="currentColor"
              opacity="0.55"
            />
          </svg>

          <div className="relative z-10 flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:text-left">
            <div className="relative">
              <div className="h-28 w-28 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl md:h-36 md:w-36 flex items-center justify-center">
                {user.avatarUrl ? (
                  <img alt="Profile avatar" className="h-full w-full object-cover" src={user.avatarUrl} />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-cyan-100 text-4xl font-black text-cyan-800 uppercase">
                    {(user.fullName || user.email || 'A').charAt(0)}
                  </span>
                )}
              </div>
              <a
                className="absolute -bottom-2 -right-2 rounded-full border-2 border-white bg-[#ff6900] p-2 text-white shadow-lg transition hover:scale-110"
                href="/profile/edit"
                aria-label="Edit profile"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </a>
            </div>

            <div className="mb-2">
              <p className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-cyan-50 backdrop-blur">
                AquaPulse profile
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">{user.fullName}</h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-white/90">
                Manage your AquaPulse account, bookings, and ticket information.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="space-y-8 lg:col-span-5">
            <section className="rounded-[2rem] border border-cyan-100 bg-white p-8 shadow-[0_4px_20px_rgba(0,206,209,0.08)]">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-950">
                <span className="material-symbols-outlined text-cyan-700">account_circle</span>
                Account Info
              </h2>

              <div className="space-y-6">
                <div>
                  <span className="mb-1 block text-sm font-bold text-slate-500">Full Name</span>
                  <p className="rounded-2xl bg-cyan-50/70 p-3 font-semibold text-slate-900">{user.fullName}</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="mb-1 block text-sm font-bold text-slate-500">Last Name</span>
                    <p className="rounded-2xl bg-cyan-50/70 p-3 font-semibold text-slate-900">{user.lastName}</p>
                  </div>
                  <div>
                    <span className="mb-1 block text-sm font-bold text-slate-500">First & Middle Name</span>
                    <p className="rounded-2xl bg-cyan-50/70 p-3 font-semibold text-slate-900">{user.firstMiddleName}</p>
                  </div>
                </div>
                <div>
                  <span className="mb-1 block text-sm font-bold text-slate-500">Email</span>
                  <p className="flex items-center gap-2 rounded-2xl bg-slate-100 p-3 text-slate-600">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    {user.email}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="mb-1 block text-sm font-bold text-slate-500">Phone</span>
                    <p className="rounded-2xl bg-cyan-50/70 p-3 font-semibold text-slate-900">{displayPhone}</p>
                  </div>
                  <div>
                    <span className="mb-1 block text-sm font-bold text-slate-500">Gender</span>
                    <p className="rounded-2xl bg-cyan-50/70 p-3 font-semibold text-slate-900">{displayGender}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="mb-1 block text-sm font-bold text-slate-500">Date of Birth</span>
                    <p className="rounded-2xl bg-cyan-50/70 p-3 font-semibold text-slate-900">{displayDob}</p>
                  </div>
                  <div>
                    <span className="mb-1 block text-sm font-bold text-slate-500">Member Since</span>
                    <p className="rounded-2xl bg-cyan-50/70 p-3 font-semibold text-slate-900">{displayCreated}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="mb-1 block text-sm font-bold text-slate-500">Role</span>
                    <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-sm font-bold text-cyan-700 uppercase">
                      {user.role}
                    </span>
                  </div>
                  <div>
                    <span className="mb-1 block text-sm font-bold text-slate-500">Status</span>
                    <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 uppercase">
                      {user.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="mb-1 block text-sm font-bold text-slate-500">Auth Provider</span>
                  <p className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-cyan-700 shadow-sm ring-1 ring-cyan-100 uppercase">
                      {displayProvider.charAt(0)}
                    </span>
                    {displayProvider}
                  </p>
                </div>
              </div>

              <a
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-cyan-700 py-3 font-bold text-white shadow-md transition hover:scale-[1.02] hover:bg-cyan-800 active:scale-95"
                href="/profile/edit"
              >
                <span className="material-symbols-outlined text-sm">edit_square</span>
                Edit Profile
              </a>
            </section>

            <section className="rounded-[2rem] border border-cyan-100 bg-white p-8 shadow-[0_4px_20px_rgba(0,206,209,0.08)]">
              <h2 className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-slate-500">Quick Actions</h2>
              <div className="flex flex-col gap-3">
                {quickActions.map((action) => (
                  <a
                    className={`group flex items-center gap-3 rounded-2xl p-3 text-left font-bold transition ${action.className}`}
                    href={action.to}
                    key={action.label}
                  >
                    <span className={`rounded-full p-2 transition group-hover:scale-110 ${action.iconClassName}`}>
                      <span className="material-symbols-outlined block text-xl">{action.icon}</span>
                    </span>
                    {action.label}
                  </a>
                ))}
              </div>
            </section>
          </aside>

          <main className="space-y-8 lg:col-span-7">
            <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {bookingStats.map((stat) => (
                <article
                  className="rounded-[1.5rem] border border-cyan-100 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  key={stat.label}
                >
                  <p className="mb-2 text-sm font-bold text-slate-500">{stat.label}</p>
                  <p className={`text-4xl font-black ${stat.className}`}>{stat.value}</p>
                </article>
              ))}
            </section>

            <section className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,206,209,0.08)] md:p-8">
              <div className="mb-8 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-950">Recent Bookings</h2>
                <a className="font-bold text-cyan-700 underline-offset-4 transition hover:underline" href="/bookings/my">
                  View All
                </a>
              </div>

              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <article
                    className="group flex flex-col justify-between gap-5 rounded-[1.5rem] border border-cyan-100 p-5 transition hover:border-cyan-300 hover:bg-cyan-50/40 md:flex-row md:items-center md:p-6"
                    key={booking.title}
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                        <img alt={booking.title} className="h-full w-full object-cover" src={booking.imageUrl} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-black transition ${booking.accentClassName}`}>{booking.title}</h3>
                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <span className="material-symbols-outlined text-sm">calendar_month</span>
                          {booking.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-6 md:justify-end">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-500">{booking.tickets}</p>
                        <p className={`font-black ${booking.amountClassName}`}>{booking.amount}</p>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-bold ${booking.statusClassName}`}>
                        <span className="material-symbols-outlined text-sm">{booking.statusIcon}</span>
                        {booking.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-cyan-100 via-cyan-200 to-yellow-100 p-8 shadow-md">
              <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <h2 className="mb-2 text-2xl font-black text-cyan-950">Upgrade to Platinum?</h2>
                  <p className="max-w-xl leading-7 text-cyan-950/75">
                    Get unlimited access to all shows, priority seating, and exclusive VIP lounge access for the whole
                    family.
                  </p>
                </div>
                <button
                  className="rounded-full bg-slate-950 px-8 py-3 font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
                  type="button"
                >
                  Learn More
                </button>
              </div>
              <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/30 blur-3xl transition duration-700" />
            </section>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
