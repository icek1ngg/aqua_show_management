import { useMemo, useState } from 'react';

import MainLayout from '../../shared/layouts/MainLayout.jsx';

const mockUser = {
  name: 'Marina Blue Waters',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Ktsr2eh2zseRpqmcWc1jQ2IUGLAARYiIysbobKUntDOh1nfDEifzPo42cD1xCI3T5oWurk7H1oKkKP_l2LrvMSTbQqGTFw60SUPYoNNMIv3gfUV3GqpU11JvrHJJDZgeCC_B5r0q8iYCRft-Kxz2bcJz_sWISuXeYsix-dHPCFCu7EefAYCNtuwQt1sSeMzD1LYvsG6zg6WcWlfRAxuW6RJDQt2u2lZ8PPXPaVPdz65gIS2xSH4QbYVkuUlpX6vy3tt5-fusYw',
};

const bookings = [
  {
    id: 'AQ-882190',
    title: 'Midnight Aqua Symphony',
    status: 'PENDING_PAYMENT',
    dateTime: 'Oct 24, 2024 - 20:00',
    venue: 'Main Plaza Pool',
    tickets: '4 Tickets',
    amount: 156,
    expiresIn: '9:44',
    createdAt: '2024-10-24T20:00:00',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBQJ-Fo4HDO72JbLax0CiFqctWCGXvU4YEfKNT6BKoii53LhvXYm3tK9deyNpu3SQhQuDwXH4brHWFob4XTMXC0igb1FTIelijgurjSK40wqc_V-h4hB2iXApJSw4tuIL9RRKwcdhGhhcgV9V5pOtwPQGvlVc5CRVwmmWl5xWGLSkDEXdqrpRF327LZc7RzHHIIOK5u5seDmxx49urrFLxksqEEDJ5_xPJn8EULd2-53B3FmPiCpcXrt3oMMoWR8T3lZdXTQe3xXQ',
  },
  {
    id: 'AQ-882145',
    title: 'Oceanic Dreams 4D',
    status: 'PAID',
    dateTime: 'Oct 20, 2024 - 18:30',
    venue: 'Grand Amphitheatre',
    tickets: '2 Tickets',
    amount: 85,
    createdAt: '2024-10-20T18:30:00',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDMtU715udYhrKO5UD5Z7WcmQPqPLM3sfRoUqm0yo9QyXaYviVVdqfJqXGt-R8q7yRyVJLCg-7yNQpxuClsEjazci4FKUvmHD8-h7VkaJqEUvZ5LGrgQc6OPyIHDftuWq5GrkH069uG0kIWEZVuOUHlSyRsz1ONwEJ_UsC5FRcoEUREr1YT7NhxEjLc3llvHYb1puPSJd-SvHfPyVBIZ0PfNO2dLzosiECIC6e8l0yAD35mD5_rDkKbENd7IbpmBKPOWznJiquMbA',
  },
  {
    id: 'AQ-879022',
    title: 'Tropical Waves Gala',
    status: 'EXPIRED',
    dateTime: 'Oct 12, 2024 - 19:00',
    venue: 'Blue Lagoon Deck',
    tickets: '5 Tickets',
    amount: 210,
    createdAt: '2024-10-12T19:00:00',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDOdYlgXL4Nwf4AWcGFjApQwu1wTev59cOd_-GZKhZAWO4Iz_zf7Tn8_yeXyi9P-cEDz6PldhiUpJ7j_1kqfhSt3YHIgmEJCtryWfqAghSSeXxzgAUM-pXEtaZhoz6g-0FlaiKz-SMUTjlXf7-QNguIhszVSRUHyFOy4zzsc6qh5RCz4gEwyyuSD5_OrUqMRuq-If6WwHs7nBE7Nwij3GBrdW3JEC77ydu5Az0EctrAsKLg-FkB0ZzurXJq_eCzA4NIrDfQsrmB1A',
  },
  {
    id: 'AQ-878804',
    title: 'Coral Reef Festival',
    status: 'FAILED',
    dateTime: 'Oct 8, 2024 - 17:30',
    venue: 'Coral Stage',
    tickets: '3 Tickets',
    amount: 135,
    createdAt: '2024-10-08T17:30:00',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCaDCEPuRXIz-tXX1TXYxFJLqc_NIsXu8w_yLI5ZUwrlr8wnEL8-kgSlFbHHypXmoS8BFV3Nt-uIqfoUBNP3vsNwRpxWltuGVcjFaEYr5i0Jxbq-UGbC8e5wY7oIaDMk2npEmreyGf9rBbp29WokyWvugQKmrBX2PoVJWFeSGUirssyqs6CAB1JREDZCBlv_mFFOq4aPXSDN7RXezaVkV4yhWwjPBXZkL6PwbhHkm0AYogBR_08bBqL0orR0zzGAHByqIypSnGUag',
  },
];

const statusFilters = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING_PAYMENT' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Failed', value: 'FAILED' },
];

const statusMeta = {
  PENDING_PAYMENT: {
    label: 'PENDING_PAYMENT',
    badgeClassName: 'bg-yellow-100 text-[#a43c12] border-yellow-200',
    dotClassName: 'bg-[#ff6900] animate-pulse',
  },
  PAID: {
    label: 'PAID',
    badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'check_circle',
  },
  EXPIRED: {
    label: 'EXPIRED',
    badgeClassName: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  FAILED: {
    label: 'FAILED',
    badgeClassName: 'bg-red-50 text-red-700 border-red-200',
    icon: 'error',
  },
};

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function BookingStatus({ booking }) {
  const meta = statusMeta[booking.status];

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <span className={`flex items-center rounded-full border px-4 py-1.5 text-xs font-black tracking-wide ${meta.badgeClassName}`}>
        {meta.icon ? <span className="material-symbols-outlined mr-1 text-[16px]">{meta.icon}</span> : null}
        {meta.dotClassName ? <span className={`mr-2 h-2 w-2 rounded-full ${meta.dotClassName}`} /> : null}
        {meta.label}
      </span>
      {booking.status === 'PENDING_PAYMENT' ? (
        <p className="text-xs font-bold text-[#ff6900]">Expires in {booking.expiresIn}</p>
      ) : null}
    </div>
  );
}

function BookingActions({ status }) {
  const commonDetail = (
    <a
      className="rounded-full border border-cyan-200 px-6 py-2 text-center text-sm font-bold text-cyan-700 transition hover:bg-cyan-50"
      href="/bookings/1"
    >
      View Detail
    </a>
  );

  if (status === 'PENDING_PAYMENT') {
    return (
      <>
        {commonDetail}
        <a
          className="rounded-full bg-cyan-700 px-8 py-2 text-center text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800"
          href="#"
        >
          Continue Payment
        </a>
      </>
    );
  }

  if (status === 'FAILED') {
    return (
      <>
        {commonDetail}
        <a
          className="rounded-full bg-[#ff6900] px-8 py-2 text-center text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
          href="#"
        >
          Try Again
        </a>
      </>
    );
  }

  return (
    <>
      {commonDetail}
      <a
        className="rounded-full bg-cyan-50 px-8 py-2 text-center text-sm font-bold text-cyan-700 shadow-sm transition hover:bg-cyan-100"
        href="#"
      >
        Book Again
      </a>
    </>
  );
}

export default function BookingHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('newest');

  const visibleBookings = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return bookings
      .filter((booking) => {
        const matchesSearch =
          normalizedSearchTerm.length === 0 ||
          booking.title.toLowerCase().includes(normalizedSearchTerm) ||
          booking.id.toLowerCase().includes(normalizedSearchTerm);
        const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((firstBooking, secondBooking) => {
        if (sortOption === 'oldest') {
          return new Date(firstBooking.createdAt) - new Date(secondBooking.createdAt);
        }

        if (sortOption === 'amountHigh') {
          return secondBooking.amount - firstBooking.amount;
        }

        return new Date(secondBooking.createdAt) - new Date(firstBooking.createdAt);
      });
  }, [searchTerm, sortOption, statusFilter]);

  const stats = {
    total: bookings.length,
    pending: bookings.filter((booking) => booking.status === 'PENDING_PAYMENT').length,
    paid: bookings.filter((booking) => booking.status === 'PAID').length,
    closed: bookings.filter((booking) => booking.status === 'EXPIRED' || booking.status === 'FAILED').length,
  };

  return (
    <MainLayout navbarProps={{ isLoggedIn: true, user: mockUser }}>
      <header className="relative overflow-hidden bg-gradient-to-br from-teal-800 to-cyan-400 px-4 pb-24 pt-16 text-white sm:px-6 lg:px-8">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute bottom-10 right-40 h-20 w-20 rounded-full bg-white/10" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-50 backdrop-blur">
            AquaPulse
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">My Bookings</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-white/90">
            Track your AquaPulse reservations, checkout status, and upcoming show plans.
          </p>
        </div>

        <svg className="absolute bottom-0 left-0 h-12 w-full fill-cyan-50" preserveAspectRatio="none" viewBox="0 0 1200 120" aria-hidden="true">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C47.45,21.9,111.45,34.09,165.1,43.35,224.78,53.64,263.38,58.62,321.39,56.44Z" />
        </svg>
      </header>

      <main className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <section className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <article className="flex items-center gap-4 rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
              <span className="material-symbols-outlined">confirmation_number</span>
            </span>
            <div>
              <p className="text-sm font-bold text-slate-500">Total Bookings</p>
              <h2 className="text-3xl font-black text-slate-950">{stats.total}</h2>
            </div>
          </article>
          <article className="flex items-center gap-4 rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-[#a43c12]">
              <span className="material-symbols-outlined">pending_actions</span>
            </span>
            <div>
              <p className="text-sm font-bold text-slate-500">Pending Payments</p>
              <h2 className="text-3xl font-black text-slate-950">{stats.pending}</h2>
            </div>
          </article>
          <article className="flex items-center gap-4 rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <span className="material-symbols-outlined">check_circle</span>
            </span>
            <div>
              <p className="text-sm font-bold text-slate-500">Paid</p>
              <h2 className="text-3xl font-black text-slate-950">{stats.paid}</h2>
            </div>
          </article>
          <article className="flex items-center gap-4 rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
              <span className="material-symbols-outlined">cancel</span>
            </span>
            <div>
              <p className="text-sm font-bold text-slate-500">Expired/Failed</p>
              <h2 className="text-3xl font-black text-slate-950">{stats.closed}</h2>
            </div>
          </article>
        </section>

        <section className="mb-8 rounded-[1.5rem] bg-cyan-50/80 p-6 shadow-sm">
          <div className="flex flex-col items-end gap-6 lg:flex-row">
            <label className="w-full flex-1">
              <span className="mb-2 ml-1 block text-sm font-bold text-slate-500">Search Bookings</span>
              <span className="relative block">
                <input
                  className="w-full rounded-full border border-cyan-100 bg-white py-3 pl-12 pr-4 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by show name or booking ID"
                  type="text"
                  value={searchTerm}
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              </span>
            </label>

            <div className="w-full lg:w-auto">
              <p className="mb-2 ml-1 text-sm font-bold text-slate-500">Status</p>
              <div className="flex flex-wrap gap-1 rounded-full border border-cyan-100 bg-white p-1">
                {statusFilters.map((filter) => (
                  <button
                    className={[
                      'rounded-full px-4 py-2 text-sm font-bold transition',
                      statusFilter === filter.value ? 'bg-cyan-700 text-white shadow-sm' : 'text-slate-500 hover:text-cyan-700',
                    ].join(' ')}
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="w-full lg:w-52">
              <span className="mb-2 ml-1 block text-sm font-bold text-slate-500">Sort By</span>
              <select
                className="w-full rounded-full border border-cyan-100 bg-white px-4 py-3 font-bold text-slate-600 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                onChange={(event) => setSortOption(event.target.value)}
                value={sortOption}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amountHigh">Price: High to Low</option>
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-6">
          {visibleBookings.map((booking) => (
            <article
              className={[
                'group flex flex-col gap-6 rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm transition hover:border-cyan-300 hover:shadow-md md:flex-row',
                booking.status === 'EXPIRED' || booking.status === 'FAILED' ? 'opacity-80 hover:opacity-100' : '',
              ].join(' ')}
              key={booking.id}
            >
              <div
                className={[
                  'h-40 w-full shrink-0 overflow-hidden rounded-2xl md:h-36 md:w-56',
                  booking.status === 'EXPIRED' || booking.status === 'FAILED' ? 'grayscale transition group-hover:grayscale-0' : '',
                ].join(' ')}
              >
                <img alt={booking.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={booking.imageUrl} />
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">#{booking.id}</span>
                      <h2 className="text-2xl font-black text-slate-950">{booking.title}</h2>
                    </div>
                    <BookingStatus booking={booking} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Date & Time</p>
                      <p className="text-sm font-semibold text-slate-800">{booking.dateTime}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Venue</p>
                      <p className="text-sm font-semibold text-slate-800">{booking.venue}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Tickets</p>
                      <p className="text-sm font-semibold text-slate-800">{booking.tickets}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Total Amount</p>
                      <p className="text-xl font-black text-cyan-700">{formatCurrency(booking.amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col justify-end gap-3 border-t border-cyan-50 pt-4 sm:flex-row">
                  <BookingActions status={booking.status} />
                </div>
              </div>
            </article>
          ))}
        </section>

        {visibleBookings.length === 0 ? (
          <section className="rounded-[1.5rem] border border-dashed border-cyan-200 bg-white p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-cyan-200">search_off</span>
            <h2 className="mt-3 text-2xl font-black text-slate-950">No bookings found</h2>
            <p className="mt-2 text-slate-500">Try a different search term or status filter.</p>
          </section>
        ) : null}

        <div className="mt-12 flex items-center justify-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-100 text-slate-500 transition hover:border-cyan-700 hover:text-cyan-700" type="button">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="h-10 w-10 rounded-full bg-cyan-700 text-sm font-black text-white shadow-sm" type="button">
            1
          </button>
          <button className="h-10 w-10 rounded-full text-sm font-black text-slate-500 transition hover:bg-cyan-50" type="button">
            2
          </button>
          <button className="h-10 w-10 rounded-full text-sm font-black text-slate-500 transition hover:bg-cyan-50" type="button">
            3
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-100 text-slate-500 transition hover:border-cyan-700 hover:text-cyan-700" type="button">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </main>
    </MainLayout>
  );
}
