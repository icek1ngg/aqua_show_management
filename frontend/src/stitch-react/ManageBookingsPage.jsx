import { useEffect, useMemo, useState } from 'react';

import { getManagerBookingDetail, getManagerBookings } from '../services/managerBookingService.js';
import { getManagerShows } from '../services/managerShowService.js';
import { getSchedules } from '../services/scheduleService.js';
import ManagerActionBar from '../features/manager/components/ManagerActionBar.jsx';
import ManagerLayout from '../features/manager/components/ManagerLayout.jsx';
import ManagerPageHeader from '../features/manager/components/ManagerPageHeader.jsx';
import ManagerStatCard from '../features/manager/components/ManagerStatCard.jsx';
import { formatCurrency, getTicketTypeLabel } from '../shared/utils/ticketPricing.js';

const bookingStatuses = ['PROCESSING', 'PENDING_PAYMENT', 'PAID', 'EXPIRED', 'FAILED'];

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function formatStatus(status) {
  return status ? status.replaceAll('_', ' ') : 'TBA';
}

function formatDate(value) {
  if (!value) {
    return 'TBA';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) {
    return 'TBA';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const formatMoney = formatCurrency;

function toInstantParam(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function truncateId(id) {
  return id ? `${String(id).slice(0, 8)}...` : 'TBA';
}

function getBookingLabel(booking) {
  return booking?.bookingCode || (booking?.id ? `#${String(booking.id).slice(0, 8)}` : 'TBA');
}

function statusBadge(status) {
  const base = 'inline-flex whitespace-nowrap rounded-full px-3 py-1 text-label-md font-bold';

  if (status === 'PAID' || status === 'SUCCESS' || status === 'VALID') {
    return `${base} bg-primary/10 text-primary`;
  }

  if (status === 'PENDING_PAYMENT' || status === 'PROCESSING' || status === 'PENDING') {
    return `${base} bg-tertiary-container/25 text-on-tertiary-container`;
  }

  if (status === 'FAILED' || status === 'EXPIRED') {
    return `${base} bg-error/10 text-error`;
  }

  return `${base} bg-surface-container-highest text-on-surface-variant`;
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-unit-md">
      <span className="text-body-sm text-on-surface-variant">{label}</span>
      <span className="max-w-[240px] break-words text-right font-body-md font-semibold text-on-surface">{value || 'TBA'}</span>
    </div>
  );
}

function BookingDetailPanel({ bookingId, detail, isLoading, error, onClose, onRetry }) {
  const booking = detail?.booking;
  const payment = detail?.payment;
  const tickets = Array.isArray(detail?.tickets) ? detail.tickets : [];
  const bookingItems = Array.isArray(booking?.items) ? booking.items : [];

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-on-surface/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <aside className="side-panel-transition fixed right-0 top-0 z-[60] flex h-full w-full max-w-[450px] flex-col border-l border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
        <header className="flex items-center justify-between border-b border-outline-variant/20 p-unit-lg">
          <div className="flex flex-col">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">{getBookingLabel(booking) || truncateId(bookingId)}</h3>
            <span className="text-body-sm text-on-surface-variant">Detailed Booking View</span>
          </div>
          <button className="rounded-full p-unit-sm transition-colors hover:bg-surface-container-high" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="custom-scrollbar flex-1 space-y-unit-xl overflow-y-auto p-unit-lg">
          {isLoading && (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-unit-md text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
              <p className="font-label-lg">Loading booking details...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-error/20 bg-error/10 p-unit-lg text-center">
              <span className="material-symbols-outlined text-4xl text-error">error</span>
              <p className="mt-unit-sm font-label-lg text-error">{error}</p>
              <button className="mt-unit-md rounded-lg bg-error px-unit-lg py-unit-sm font-label-lg text-on-error" type="button" onClick={onRetry}>
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && booking && (
            <>
              <div className="flex items-center justify-between rounded-xl bg-surface-container p-unit-md">
                <div className="flex flex-col gap-1">
                  <span className="text-label-md uppercase text-on-surface-variant">Booking Status</span>
                  <span className={statusBadge(booking.status)}>{formatStatus(booking.status)}</span>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="text-label-md uppercase text-on-surface-variant">Payment</span>
                  <span className={statusBadge(payment?.status || booking.paymentStatus)}>{formatStatus(payment?.status || booking.paymentStatus)}</span>
                </div>
              </div>

              <section className="space-y-unit-md">
                <div className="flex items-center gap-unit-sm">
                  <span className="material-symbols-outlined text-primary">person</span>
                  <h4 className="font-label-lg uppercase text-on-surface">Customer Information</h4>
                </div>
                <div className="space-y-unit-md rounded-xl border border-outline-variant/20 p-unit-md">
                  <DetailRow label="Full Name" value={booking.customerName} />
                  <DetailRow label="Email Address" value={booking.customerEmail} />
                  <DetailRow label="Created" value={formatDateTime(booking.createdAt)} />
                  <DetailRow label="Expires" value={formatDateTime(booking.expiresAt)} />
                </div>
              </section>

              <section className="space-y-unit-md">
                <div className="flex items-center gap-unit-sm">
                  <span className="material-symbols-outlined text-primary">theater_comedy</span>
                  <h4 className="font-label-lg uppercase text-on-surface">Selected Tickets</h4>
                </div>
                <div className="space-y-unit-md rounded-xl border border-outline-variant/20 p-unit-md">
                  {bookingItems.length === 0 ? <p className="text-body-sm text-on-surface-variant">No booking items returned.</p> : bookingItems.map((item) => (
                    <div className="rounded-lg bg-surface-container-low p-unit-md" key={item.id}>
                      <p className="font-label-lg font-bold text-on-surface">{item.showName}</p>
                      <p className="mt-1 text-body-sm text-on-surface-variant">{formatDateTime(item.startTime)} · {item.venueName || 'Venue TBA'}</p>
                      <p className="mt-1 text-body-sm font-semibold text-primary">{getTicketTypeLabel(item.ticketType)} · {item.quantity} × {formatMoney(item.unitPrice)}</p>
                      <p className="mt-1 text-right font-label-lg font-bold text-on-surface">{formatMoney(item.lineTotal)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-unit-md">
                <div className="flex items-center gap-unit-sm">
                  <span className="material-symbols-outlined text-primary">receipt_long</span>
                  <h4 className="font-label-lg uppercase text-on-surface">Payment Summary</h4>
                </div>
                <div className="space-y-unit-md rounded-xl border border-outline-variant/20 p-unit-md">
                  <DetailRow label="Total Tickets" value={booking.totalQuantity ?? booking.quantity} />
                  <DetailRow label="Booking Total" value={formatMoney(booking.totalAmount)} />
                  <DetailRow label="Payment Amount" value={payment ? formatMoney(payment.amount) : 'No payment record'} />
                  <DetailRow label="PayOS Order Code" value={payment?.payosOrderCode} />
                  <DetailRow label="Transaction ID" value={payment?.transactionId} />
                  <DetailRow label="Paid At" value={formatDateTime(payment?.paidAt)} />
                </div>
              </section>

              <section className="space-y-unit-md pb-unit-xl">
                <div className="flex items-center gap-unit-sm">
                  <span className="material-symbols-outlined text-primary">confirmation_number</span>
                  <h4 className="font-label-lg uppercase text-on-surface">Tickets</h4>
                </div>
                <div className="space-y-unit-sm rounded-xl border border-outline-variant/20 p-unit-md">
                  {tickets.length === 0 ? (
                    <p className="text-body-sm text-on-surface-variant">No tickets returned for this booking.</p>
                  ) : (
                    tickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-lg bg-surface-container-low p-unit-md">
                        <div className="flex items-center justify-between gap-unit-md">
                          <span className="font-label-md font-bold text-primary">#{truncateId(ticket.id)}</span>
                          <span className={statusBadge(ticket.status)}>{formatStatus(ticket.status)}</span>
                        </div>
                        <div className="mt-unit-sm grid grid-cols-1 gap-unit-sm text-body-sm text-on-surface-variant">
                          <span>Issued: {formatDateTime(ticket.issuedAt)}</span>
                          <span>Used: {formatDateTime(ticket.usedAt)}</span>
                          {ticket.qrCode && <span className="truncate">QR: {ticket.qrCode}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        <footer className="border-t border-outline-variant/20 bg-surface-container-low/50 p-unit-lg">
          <button className="w-full rounded-lg bg-primary py-unit-md font-label-lg text-on-primary shadow-lg shadow-primary/20 transition-all hover:opacity-90" type="button" onClick={onClose}>
            Close Details
          </button>
        </footer>
      </aside>
    </>
  );
}

export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [shows, setShows] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filters, setFilters] = useState({
    showId: '',
    scheduleId: '',
    status: '',
    fromTime: '',
    toTime: '',
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [referenceError, setReferenceError] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [bookingDetail, setBookingDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadShows() {
      try {
        const response = await getManagerShows({ page: 0, size: 100 });

        if (isActive) {
          setShows(Array.isArray(response?.items) ? response.items : []);
        }
      } catch (error) {
        if (isActive) {
          setReferenceError(getErrorMessage(error, 'Could not load shows for booking filters.'));
        }
      }
    }

    loadShows();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadSchedulesForShow() {
      if (!filters.showId) {
        setSchedules([]);
        setIsScheduleLoading(false);
        return;
      }

      setIsScheduleLoading(true);
      setReferenceError('');

      try {
        const response = await getSchedules({ showId: filters.showId, page: 0, size: 100 });

        if (isActive) {
          setSchedules(Array.isArray(response?.items) ? response.items : []);
        }
      } catch (error) {
        if (isActive) {
          setSchedules([]);
          setReferenceError(getErrorMessage(error, 'Could not load schedules for the selected show.'));
        }
      } finally {
        if (isActive) {
          setIsScheduleLoading(false);
        }
      }
    }

    loadSchedulesForShow();

    return () => {
      isActive = false;
    };
  }, [filters.showId]);

  useEffect(() => {
    let isActive = true;

    async function loadBookings() {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getManagerBookings({
          showId: filters.showId,
          scheduleId: filters.scheduleId,
          status: filters.status,
          fromTime: toInstantParam(filters.fromTime),
          toTime: toInstantParam(filters.toTime),
          page: currentPage,
          size: pagination.size,
        });

        if (!isActive) {
          return;
        }

        const items = Array.isArray(response?.items) ? response.items : [];
        setBookings(items);
        setPagination({
          page: response?.page ?? currentPage,
          size: response?.size ?? pagination.size,
          totalItems: response?.totalItems ?? items.length,
          totalPages: response?.totalPages ?? (items.length ? 1 : 0),
          hasNext: Boolean(response?.hasNext),
          hasPrevious: Boolean(response?.hasPrevious),
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setBookings([]);
        setPagination((current) => ({
          ...current,
          page: currentPage,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        }));
        setLoadError(getErrorMessage(error, 'Could not load manager bookings.'));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      isActive = false;
    };
  }, [currentPage, filters, pagination.size, reloadKey]);

  async function loadBookingDetail(id) {
    setIsDetailLoading(true);
    setDetailError('');

    try {
      const response = await getManagerBookingDetail(id);
      setBookingDetail(response);
    } catch (error) {
      setBookingDetail(null);
      setDetailError(getErrorMessage(error, 'Could not load booking details.'));
    } finally {
      setIsDetailLoading(false);
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'showId' ? { scheduleId: '' } : {}),
    }));
    setCurrentPage(0);
  }

  function clearFilters() {
    setFilters({
      showId: '',
      scheduleId: '',
      status: '',
      fromTime: '',
      toTime: '',
    });
    setCurrentPage(0);
  }

  function openDetail(booking) {
    setSelectedBookingId(booking.id);
    setBookingDetail(null);
    loadBookingDetail(booking.id);
  }

  function closeDetail() {
    setSelectedBookingId(null);
    setBookingDetail(null);
    setDetailError('');
  }

  const stats = useMemo(() => {
    const paid = bookings.filter((booking) => booking.status === 'PAID').length;
    const pending = bookings.filter((booking) => booking.status === 'PENDING_PAYMENT' || booking.status === 'PROCESSING').length;
    const revenue = bookings
      .filter((booking) => booking.status === 'PAID')
      .reduce((total, booking) => total + (Number(booking.totalAmount) || 0), 0);

    return {
      total: pagination.totalItems,
      paid,
      pending,
      revenue,
    };
  }, [bookings, pagination.totalItems]);

  const startItem = bookings.length === 0 ? 0 : pagination.page * pagination.size + 1;
  const endItem = bookings.length === 0 ? 0 : startItem + bookings.length - 1;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      <style>{`body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f1fbfb;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #bac9c9;
            border-radius: 10px;
        }
        .side-panel-transition {
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }`}</style>

      <ManagerLayout
        className="relative flex h-full w-[calc(100%-theme(spacing.sidebar-width))] flex-col"
        contentClassName="custom-scrollbar flex-1 space-y-unit-lg overflow-y-auto p-unit-lg"
        headerTitle="Manage Bookings"
        headerDescription="Read-only booking, payment, and ticket monitoring"
      >
          <ManagerPageHeader
            title="Booking Operations"
            description="Review booking, payment, and ticket state without administrator user or role controls."
          />
          <section className="grid grid-cols-1 gap-unit-md md:grid-cols-2 xl:grid-cols-4">
            <ManagerStatCard icon="event_seat" label="Total Bookings" value={stats.total} />
            <ManagerStatCard icon="check_circle" label="Paid On Page" tone="primary" value={stats.paid} />
            <ManagerStatCard icon="hourglass_empty" label="Pending On Page" tone="tertiary" value={stats.pending} />
            <ManagerStatCard icon="payments" label="Paid Revenue On Page" tone="neutral" value={formatMoney(stats.revenue)} />
          </section>

          <ManagerActionBar className="glass-panel items-end rounded-xl">
            <div className="flex min-w-[220px] flex-col gap-1">
              <label className="px-1 text-label-md text-on-surface-variant" htmlFor="booking-show-filter">Show</label>
              <select
                className="rounded-lg border-none bg-surface-container-low px-3 py-2.5 text-body-sm focus:ring-primary/20"
                id="booking-show-filter"
                name="showId"
                value={filters.showId}
                onChange={handleFilterChange}
              >
                <option value="">All Shows</option>
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-w-[220px] flex-col gap-1">
              <label className="px-1 text-label-md text-on-surface-variant" htmlFor="booking-schedule-filter">Schedule</label>
              <select
                className="rounded-lg border-none bg-surface-container-low px-3 py-2.5 text-body-sm focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!filters.showId || isScheduleLoading}
                id="booking-schedule-filter"
                name="scheduleId"
                value={filters.scheduleId}
                onChange={handleFilterChange}
              >
                <option value="">{filters.showId ? 'All Schedules' : 'Select a show first'}</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {formatDateTime(schedule.startTime)} - {schedule.venueName || truncateId(schedule.venueId)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-w-[180px] flex-col gap-1">
              <label className="px-1 text-label-md text-on-surface-variant" htmlFor="booking-status-filter">Booking Status</label>
              <select
                className="rounded-lg border-none bg-surface-container-low px-3 py-2.5 text-body-sm focus:ring-primary/20"
                id="booking-status-filter"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                {bookingStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-w-[190px] flex-col gap-1">
              <label className="px-1 text-label-md text-on-surface-variant" htmlFor="booking-from-filter">From</label>
              <input
                className="rounded-lg border-none bg-surface-container-low px-3 py-2.5 text-body-sm focus:ring-primary/20"
                id="booking-from-filter"
                name="fromTime"
                type="datetime-local"
                value={filters.fromTime}
                onChange={handleFilterChange}
              />
            </div>

            <div className="flex min-w-[190px] flex-col gap-1">
              <label className="px-1 text-label-md text-on-surface-variant" htmlFor="booking-to-filter">To</label>
              <input
                className="rounded-lg border-none bg-surface-container-low px-3 py-2.5 text-body-sm focus:ring-primary/20"
                id="booking-to-filter"
                name="toTime"
                type="datetime-local"
                value={filters.toTime}
                onChange={handleFilterChange}
              />
            </div>

            <div className="ml-auto flex gap-unit-sm">
              <button className="flex items-center gap-2 rounded-lg bg-secondary-container px-unit-lg py-2.5 font-label-lg text-on-secondary-container transition-all hover:opacity-90" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                <span className="material-symbols-outlined text-body-md">refresh</span>
                Refresh
              </button>
              <button className="rounded-lg bg-surface-container-high px-unit-lg py-2.5 font-label-lg text-on-surface-variant transition-all hover:bg-surface-container-highest" type="button" onClick={clearFilters}>
                Reset
              </button>
            </div>
          </ManagerActionBar>

          {referenceError && (
            <div className="rounded-lg border border-error/20 bg-error/10 p-unit-md text-body-sm font-bold text-error">
              {referenceError}
            </div>
          )}

          <section className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
            {loadError && (
              <div className="m-unit-lg rounded-lg border border-error/20 bg-error/10 p-unit-lg text-center">
                <span className="material-symbols-outlined text-4xl text-error">error</span>
                <p className="mt-unit-sm font-label-lg text-error">{loadError}</p>
                <button className="mt-unit-md rounded-lg bg-error px-unit-lg py-unit-sm font-label-lg text-on-error" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                  Retry
                </button>
              </div>
            )}

            {!loadError && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-unit-lg py-unit-md font-label-lg uppercase tracking-wider text-on-surface-variant">Booking ID</th>
                      <th className="px-unit-lg py-unit-md font-label-lg uppercase tracking-wider text-on-surface-variant">Customer</th>
                      <th className="px-unit-lg py-unit-md font-label-lg uppercase tracking-wider text-on-surface-variant">Show</th>
                      <th className="px-unit-lg py-unit-md font-label-lg uppercase tracking-wider text-on-surface-variant">Show Date</th>
                      <th className="px-unit-lg py-unit-md font-label-lg uppercase tracking-wider text-on-surface-variant">Qty</th>
                      <th className="px-unit-lg py-unit-md font-label-lg uppercase tracking-wider text-on-surface-variant">Total</th>
                      <th className="px-unit-lg py-unit-md font-label-lg uppercase tracking-wider text-on-surface-variant">Status</th>
                      <th className="px-unit-lg py-unit-md font-label-lg uppercase tracking-wider text-on-surface-variant">Payment</th>
                      <th className="px-unit-lg py-unit-md font-label-lg uppercase tracking-wider text-on-surface-variant">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {isLoading && (
                      <tr>
                        <td className="px-unit-lg py-unit-xl text-center text-on-surface-variant" colSpan={9}>
                          <span className="material-symbols-outlined animate-spin align-middle text-primary">progress_activity</span>
                          <span className="ml-unit-sm font-label-lg">Loading bookings...</span>
                        </td>
                      </tr>
                    )}

                    {!isLoading && bookings.length === 0 && (
                      <tr>
                        <td className="px-unit-lg py-unit-xl text-center" colSpan={9}>
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant">event_busy</span>
                          <p className="mt-unit-sm font-label-lg text-on-surface">No bookings found</p>
                          <p className="text-body-sm text-on-surface-variant">Try clearing filters or selecting a different show and date range.</p>
                        </td>
                      </tr>
                    )}

                    {!isLoading &&
                      bookings.map((booking) => (
                        <tr key={booking.id} className="cursor-pointer transition-colors hover:bg-primary/5" onClick={() => openDetail(booking)}>
                          <td className="px-unit-lg py-unit-md font-label-md font-bold text-primary">{getBookingLabel(booking)}</td>
                          <td className="px-unit-lg py-unit-md">
                            <div className="flex flex-col">
                              <span className="font-body-md font-semibold text-on-surface">{booking.customerName || 'Guest'}</span>
                              <span className="text-body-sm text-on-surface-variant">{booking.customerEmail || 'No email'}</span>
                            </div>
                          </td>
                          <td className="px-unit-lg py-unit-md font-body-md">{booking.showName || truncateId(booking.showId)}{Number(booking.items?.length || 0) > 1 ? ` +${booking.items.length - 1} more` : ''}</td>
                          <td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">{formatDate(booking.showDate)}</td>
                          <td className="px-unit-lg py-unit-md font-body-md">{booking.totalQuantity ?? booking.quantity ?? 'TBA'}</td>
                          <td className="px-unit-lg py-unit-md font-body-md font-semibold">{formatMoney(booking.totalAmount)}</td>
                          <td className="px-unit-lg py-unit-md">
                            <span className={statusBadge(booking.status)}>{formatStatus(booking.status)}</span>
                          </td>
                          <td className="px-unit-lg py-unit-md">
                            <span className={statusBadge(booking.paymentStatus)}>{formatStatus(booking.paymentStatus)}</span>
                          </td>
                          <td className="px-unit-lg py-unit-md">
                            <button className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high" type="button" onClick={(event) => { event.stopPropagation(); openDetail(booking); }}>
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low/30 px-unit-lg py-unit-md">
              <span className="text-body-sm text-on-surface-variant">
                Showing {startItem} to {endItem} of {pagination.totalItems} bookings
                {pagination.totalPages > 0 ? ` · Page ${pagination.page + 1} of ${pagination.totalPages}` : ''}
              </span>
              <div className="flex gap-unit-xs">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isLoading || !pagination.hasPrevious}
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                >
                  <span className="material-symbols-outlined text-body-md">chevron_left</span>
                </button>
                <button className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary px-unit-sm font-label-md text-on-primary shadow-md" type="button">
                  {pagination.page + 1}
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isLoading || !pagination.hasNext}
                  type="button"
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  <span className="material-symbols-outlined text-body-md">chevron_right</span>
                </button>
              </div>
            </div>
          </section>

        {selectedBookingId && (
          <BookingDetailPanel
            bookingId={selectedBookingId}
            detail={bookingDetail}
            error={detailError}
            isLoading={isDetailLoading}
            onClose={closeDetail}
            onRetry={() => loadBookingDetail(selectedBookingId)}
          />
        )}
      </ManagerLayout>
    </div>
  );
}
