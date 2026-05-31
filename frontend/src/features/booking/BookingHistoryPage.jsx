import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getMyBookings } from '../../services/bookingService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';

const fallbackImageUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBQJ-Fo4HDO72JbLax0CiFqctWCGXvU4YEfKNT6BKoii53LhvXYm3tK9deyNpu3SQhQuDwXH4brHWFob4XTMXC0igb1FTIelijgurjSK40wqc_V-h4hB2iXApJSw4tuIL9RRKwcdhGhhcgV9V5pOtwPQGvlVc5CRVwmmWl5xWGLSkDEXdqrpRF327LZc7RzHHIIOK5u5seDmxx49urrFLxksqEEDJ5_xPJn8EULd2-53B3FmPiCpcXrt3oMMoWR8T3lZdXTQe3xXQ';

const statusFilters = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Failed', value: 'FAILED' },
];

const statusMeta = {
  PROCESSING: {
    label: 'PROCESSING',
    badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    icon: 'progress_activity',
  },
  PENDING_PAYMENT: {
    label: 'PENDING_PAYMENT',
    badgeClassName: 'border-yellow-200 bg-yellow-100 text-[#a43c12]',
    dotClassName: 'bg-[#ff6900] animate-pulse',
  },
  PAID: {
    label: 'PAID',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: 'check_circle',
  },
  EXPIRED: {
    label: 'EXPIRED',
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: 'timer_off',
  },
  FAILED: {
    label: 'FAILED',
    badgeClassName: 'border-red-200 bg-red-50 text-red-700',
    icon: 'error',
  },
};

const pageSize = 5;

function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getBookingErrorMessage(error) {
  if (error?.response?.status === 401) {
    return 'Please sign in to view your bookings.';
  }

  return error?.response?.data?.message || 'Could not load your bookings. Please try again.';
}

function normalizeBooking(booking) {
  return {
    id: booking.id,
    bookingCode: booking.bookingCode || booking.id,
    showName: booking.showName || 'AquaPulse Show',
    showDate: booking.showDate,
    ticketType: booking.ticketType || 'Standard Entry',
    quantity: booking.quantity ?? 0,
    totalAmount: booking.totalAmount,
    status: booking.status || 'PROCESSING',
    createdAt: booking.createdAt,
    expiresAt: booking.expiresAt,
    imageUrl: fallbackImageUrl,
  };
}

function matchesStatusFilter(bookingStatus, filterValue) {
  if (filterValue === 'ALL') {
    return true;
  }

  if (filterValue === 'PENDING') {
    return bookingStatus === 'PENDING_PAYMENT' || bookingStatus === 'PROCESSING';
  }

  return bookingStatus === filterValue;
}

function BookingStatus({ status, expiresAt }) {
  const meta = statusMeta[status] || statusMeta.PROCESSING;

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <span className={`flex items-center rounded-full border px-4 py-1.5 text-xs font-black tracking-wide ${meta.badgeClassName}`}>
        {meta.icon ? <span className="material-symbols-outlined mr-1 text-[16px]">{meta.icon}</span> : null}
        {meta.dotClassName ? <span className={`mr-2 h-2 w-2 rounded-full ${meta.dotClassName}`} /> : null}
        {meta.label}
      </span>
      {status === 'PENDING_PAYMENT' && expiresAt ? (
        <p className="text-xs font-bold text-[#ff6900]">Held until {formatDateTime(expiresAt)}</p>
      ) : null}
    </div>
  );
}

function BookingAction({ booking }) {
  const target = booking.status === 'PENDING_PAYMENT' ? `/bookings/${booking.id}/pending` : `/bookings/${booking.id}`;
  const label = booking.status === 'PENDING_PAYMENT' ? 'Open Pending Payment' : 'View Details';

  return (
    <Link
      className="rounded-full bg-cyan-700 px-8 py-2 text-center text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800"
      to={target}
    >
      {label}
    </Link>
  );
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    size: pageSize,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    async function loadBookings() {
      try {
        setIsLoading(true);
        setLoadError('');
        const bookingPage = await getMyBookings({ page: currentPage, size: pageSize });
        if (!isMounted) {
          return;
        }

        const items = Array.isArray(bookingPage?.items) ? bookingPage.items : [];
        setBookings(items.map(normalizeBooking));
        setPagination({
          page: Number.isInteger(bookingPage?.page) ? bookingPage.page : currentPage,
          size: Number.isInteger(bookingPage?.size) ? bookingPage.size : pageSize,
          totalItems: Number.isFinite(bookingPage?.totalItems) ? bookingPage.totalItems : items.length,
          totalPages: Number.isInteger(bookingPage?.totalPages) ? bookingPage.totalPages : 0,
          hasNext: Boolean(bookingPage?.hasNext),
          hasPrevious: Boolean(bookingPage?.hasPrevious),
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401) {
          navigate('/login', { replace: true, state: { from: location } });
          return;
        }

        setLoadError(getBookingErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, [currentPage, location, navigate]);

  const visibleBookings = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return [...bookings]
      .filter((booking) => {
        const matchesSearch =
          normalizedSearchTerm.length === 0 ||
          booking.showName.toLowerCase().includes(normalizedSearchTerm) ||
          booking.bookingCode.toLowerCase().includes(normalizedSearchTerm);
        const matchesStatus = matchesStatusFilter(booking.status, statusFilter);

        return matchesSearch && matchesStatus;
      })
      .sort((firstBooking, secondBooking) => {
        const firstTime = new Date(firstBooking.createdAt || 0).getTime();
        const secondTime = new Date(secondBooking.createdAt || 0).getTime();

        return secondTime - firstTime;
      });
  }, [bookings, searchTerm, statusFilter]);

  const stats = {
    total: pagination.totalItems,
    pending: bookings.filter((booking) => matchesStatusFilter(booking.status, 'PENDING')).length,
    paid: bookings.filter((booking) => booking.status === 'PAID').length,
    closed: bookings.filter((booking) => ['EXPIRED', 'FAILED'].includes(booking.status)).length,
  };

  const hasNoBookings = !isLoading && !loadError && pagination.totalItems === 0;
  const hasNoPageResults = !isLoading && !loadError && pagination.totalItems > 0 && bookings.length === 0;
  const hasNoFilteredResults = !isLoading && !loadError && bookings.length > 0 && visibleBookings.length === 0;
  const totalPages = Math.max(pagination.totalPages, pagination.totalItems > 0 ? 1 : 0);

  return (
    <MainLayout>
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
          <StatsCard icon="confirmation_number" label="Total Bookings" value={stats.total} iconClassName="bg-cyan-100 text-cyan-700" />
          <StatsCard icon="pending_actions" label="Pending" value={stats.pending} iconClassName="bg-yellow-100 text-[#a43c12]" />
          <StatsCard icon="check_circle" label="Paid" value={stats.paid} iconClassName="bg-emerald-100 text-emerald-700" />
          <StatsCard icon="cancel" label="Closed" value={stats.closed} iconClassName="bg-red-100 text-red-700" />
        </section>

        <section className="mb-8 rounded-[1.5rem] bg-cyan-50/80 p-6 shadow-sm">
          <div className="flex flex-col items-end gap-6 lg:flex-row">
            <label className="w-full flex-1">
              <span className="mb-2 ml-1 block text-sm font-bold text-slate-500">Search Bookings</span>
              <span className="relative block">
                <input
                  className="w-full rounded-full border border-cyan-100 bg-white py-3 pl-12 pr-4 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by show name or booking code"
                  type="text"
                  value={searchTerm}
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              </span>
            </label>

            <div className="w-full lg:w-auto">
              <p className="mb-2 ml-1 text-sm font-bold text-slate-500">Status</p>
              <div className="flex flex-wrap gap-1 rounded-[1.25rem] border border-cyan-100 bg-white p-1">
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
              <p className="mt-2 ml-1 text-xs font-semibold text-slate-400">Filters apply to the current page.</p>
            </div>
          </div>
        </section>

        {isLoading && (
          <section className="rounded-[1.5rem] border border-cyan-100 bg-white p-10 text-center shadow-sm" role="status">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-700 border-t-transparent" />
            <h2 className="mt-4 text-2xl font-black text-slate-950">Loading your bookings...</h2>
            <p className="mt-2 text-slate-500">AquaPulse is retrieving your latest reservations.</p>
          </section>
        )}

        {!isLoading && loadError && (
          <section className="rounded-[1.5rem] border border-red-100 bg-white p-10 text-center shadow-sm" role="alert">
            <span className="material-symbols-outlined text-5xl text-red-400">error</span>
            <h2 className="mt-3 text-2xl font-black text-slate-950">Could not load bookings</h2>
            <p className="mt-2 text-slate-500">{loadError}</p>
          </section>
        )}

        {hasNoBookings && (
          <section className="rounded-[1.5rem] border border-dashed border-cyan-200 bg-white p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-cyan-200">confirmation_number</span>
            <h2 className="mt-3 text-2xl font-black text-slate-950">You have no bookings yet.</h2>
            <p className="mt-2 text-slate-500">Choose an AquaPulse show and your booking history will appear here.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link className="rounded-full bg-cyan-700 px-6 py-3 font-bold text-white transition hover:bg-cyan-800" to="/bookings/create">
                Book Now
              </Link>
              <Link className="rounded-full border border-cyan-200 bg-white px-6 py-3 font-bold text-cyan-700 transition hover:bg-cyan-50" to="/">
                Back Home
              </Link>
            </div>
          </section>
        )}

        {hasNoPageResults && (
          <section className="rounded-[1.5rem] border border-dashed border-cyan-200 bg-white p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-cyan-200">event_busy</span>
            <h2 className="mt-3 text-2xl font-black text-slate-950">No bookings on this page</h2>
            <p className="mt-2 text-slate-500">Go back to the previous page to continue browsing your booking history.</p>
            <button
              className="mt-6 rounded-full border border-cyan-200 bg-white px-6 py-3 font-bold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!pagination.hasPrevious || isLoading}
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              type="button"
            >
              Previous Page
            </button>
          </section>
        )}

        {!isLoading && !loadError && visibleBookings.length > 0 && (
          <section className="space-y-6">
            {visibleBookings.map((booking) => (
              <article
                className={[
                  'group flex flex-col gap-6 rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm transition hover:border-cyan-300 hover:shadow-md md:flex-row',
                  ['EXPIRED', 'FAILED'].includes(booking.status) ? 'opacity-80 hover:opacity-100' : '',
                ].join(' ')}
                key={booking.id}
              >
                <div
                  className={[
                    'h-40 w-full shrink-0 overflow-hidden rounded-2xl md:h-36 md:w-56',
                    ['EXPIRED', 'FAILED'].includes(booking.status) ? 'grayscale transition group-hover:grayscale-0' : '',
                  ].join(' ')}
                >
                  <img alt={booking.showName} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={booking.imageUrl} />
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">#{booking.bookingCode}</span>
                        <h2 className="text-2xl font-black text-slate-950">{booking.showName}</h2>
                      </div>
                      <BookingStatus status={booking.status} expiresAt={booking.expiresAt} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <BookingInfo label="Show Date" value={formatDate(booking.showDate)} />
                      <BookingInfo label="Ticket Type" value={booking.ticketType} />
                      <BookingInfo label="Quantity" value={`${booking.quantity} Ticket${booking.quantity === 1 ? '' : 's'}`} />
                      <BookingInfo label="Total Amount" value={formatCurrency(booking.totalAmount)} strong />
                      <BookingInfo label="Created At" value={formatDateTime(booking.createdAt)} />
                      <BookingInfo label="Expires At" value={formatDateTime(booking.expiresAt)} />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col justify-end gap-3 border-t border-cyan-50 pt-4 sm:flex-row">
                    <BookingAction booking={booking} />
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {hasNoFilteredResults && (
          <section className="rounded-[1.5rem] border border-dashed border-cyan-200 bg-white p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-cyan-200">search_off</span>
            <h2 className="mt-3 text-2xl font-black text-slate-950">No bookings found</h2>
            <p className="mt-2 text-slate-500">No bookings match this filter on this page.</p>
            <button
              className="mt-6 rounded-full border border-cyan-200 bg-white px-6 py-3 font-bold text-cyan-700 transition hover:bg-cyan-50"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
              }}
              type="button"
            >
              Clear Filters
            </button>
          </section>
        )}

        {!isLoading && !loadError && pagination.totalItems > 0 && (
          <nav className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[1.5rem] border border-cyan-100 bg-white p-4 shadow-sm sm:flex-row" aria-label="Bookings pagination">
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-200 bg-white px-5 py-3 text-sm font-bold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              disabled={!pagination.hasPrevious || isLoading}
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
              Previous
            </button>
            <p className="text-sm font-black text-slate-600">
              Page {pagination.page + 1} of {totalPages}
              <span className="ml-2 font-semibold text-slate-400">({pagination.totalItems} total)</span>
            </p>
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-200 bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:border-cyan-100 disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto"
              disabled={!pagination.hasNext || isLoading}
              onClick={() => setCurrentPage((page) => page + 1)}
              type="button"
            >
              Next
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </nav>
        )}
      </main>
    </MainLayout>
  );
}

function StatsCard({ icon, label, value, iconClassName }) {
  return (
    <article className="flex items-center gap-4 rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm transition hover:shadow-md">
      <span className={`flex h-12 w-12 items-center justify-center rounded-full ${iconClassName}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </span>
      <div>
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <h2 className="text-3xl font-black text-slate-950">{value}</h2>
      </div>
    </article>
  );
}

function BookingInfo({ label, value, strong = false }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={strong ? 'text-xl font-black text-cyan-700' : 'text-sm font-semibold text-slate-800'}>
        {value || 'Not available'}
      </p>
    </div>
  );
}
